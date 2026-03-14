import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { StorageService } from '../storage/storage.service';
const AdmZip = require('adm-zip');

export interface ParsedFileResult {
  text: string;
  imageUrls: string[]; // storage ga yuklangan rasm URLlar
  formulas: string[]; // LaTeX formulalar
}

@Injectable()
export class FileParserService {
  constructor(private readonly storageService: StorageService) {}

  async parseFile(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ParsedFileResult> {
    if (mimeType === 'application/pdf') {
      return this.parsePdf(buffer);
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalName.endsWith('.docx')
    ) {
      return this.parseDocx(buffer);
    }

    if (mimeType === 'text/plain' || originalName.endsWith('.txt')) {
      return this.parseTxt(buffer);
    }

    throw new BadRequestException(
      "Fayl turi qo'llab-quvvatlanmaydi. Faqat .pdf, .docx, .txt",
    );
  }

  // ============================================
  // PDF
  // ============================================
  private async parsePdf(buffer: Buffer): Promise<ParsedFileResult> {
    const imageUrls: string[] = [];
    const { PDFParse } = require('pdf-parse');

    const parser = new PDFParse({ data: buffer });

    // 1. Matn ajratish
    const textResult = await parser.getText();

    // 2. Rasmlarni ajratish
    try {
      const imageResult = await parser.getImage();

      for (const page of imageResult.pages) {
        for (const img of page.images ?? []) {
          try {
            const url = await this.storageService.uploadImage(
              Buffer.from(img.data),
              `pdf-image-${Date.now()}.png`,
              'image/png',
            );
            imageUrls.push(url);
          } catch {
            console.warn('Rasm yuklanmadi');
          }
        }
      }
    } catch (e) {
      console.warn('PDF rasmlarni ajratishda xato:', e.message);
    }

    await parser.destroy();

    return {
      text: textResult.text
        .replace(/\s+/g, ' ') // ko'p bo'sh joylarni bittaga
        .trim(),
      imageUrls,
      formulas: [],
    };
  }

  // ============================================
  // DOCX
  // ============================================
  private async parseDocx(buffer: Buffer): Promise<ParsedFileResult> {
    const imageUrls: string[] = [];
    const images: { buffer: Buffer; fileName: string; mimeType: string }[] = [];

    // 1. Rasmlarni ajratish
    await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imgBuffer = await image.read();
          images.push({
            buffer: imgBuffer,
            fileName: `docx-image-${Date.now()}.${image.contentType.split('/')[1]}`,
            mimeType: image.contentType,
          });
          return { src: '' };
        }),
      },
    );

    // Rasmlarni storage ga yuklash
    for (const image of images) {
      try {
        const url = await this.storageService.uploadImage(
          image.buffer,
          image.fileName,
          image.mimeType,
        );
        imageUrls.push(url);
      } catch {
        console.warn(`Rasm yuklanmadi: ${image.fileName}`);
      }
    }

    // 2. XML dan to'liq matnni formulalar bilan birga o'qish
    const fullText = this.extractTextWithFormulas(buffer);

    // 3. Formulalarni alohida ham saqlaymiz (AI uchun qo'shimcha)
    const formulas = this.extractFormulasFromDocx(buffer);

    return {
      text: fullText,
      imageUrls,
      formulas,
    };
  }

  // XML dan matnni formulalar bilan birga o'qish
  private extractTextWithFormulas(buffer: Buffer): string {
    try {
      const zip = new AdmZip(buffer);
      const documentXml = zip.readAsText('word/document.xml');

      const lines: string[] = [];

      // Har bir paragrafni o'qish
      const paraRegex = /<w:p[ >]([\s\S]*?)<\/w:p>/g;
      let paraMatch;

      while ((paraMatch = paraRegex.exec(documentXml)) !== null) {
        const paraXml = paraMatch[1];
        let lineText = '';

        // Paragraf ichidagi run larni ketma-ket o'qish
        // Run = <w:r> (oddiy matn) yoki <m:oMath> (formula)
        const tokenRegex =
          /(<w:r[ >][\s\S]*?<\/w:r>|<m:oMath>[\s\S]*?<\/m:oMath>)/g;
        let tokenMatch;

        while ((tokenMatch = tokenRegex.exec(paraXml)) !== null) {
          const token = tokenMatch[1];

          if (token.startsWith('<m:oMath>')) {
            // Formula — LaTeX ga o'girish
            const innerXml = token
              .replace('<m:oMath>', '')
              .replace('</m:oMath>', '');
            const latex = this.ommlToLatex(innerXml);
            lineText += latex;
          } else {
            // Oddiy matn — <w:t> ichidagi matnni olish
            const textMatches = [
              ...token.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g),
            ];
            lineText += textMatches.map((m) => m[1]).join('');
          }
        }

        if (lineText.trim()) lines.push(lineText.trim());
      }

      return lines.join('\n');
    } catch (e) {
      console.warn("XML matn o'qishda xato:", e.message);
      // Xato bo'lsa mammoth matnini qaytaramiz
      return '';
    }
  }

  // ============================================
  // TXT
  // ============================================
  private parseTxt(buffer: Buffer): ParsedFileResult {
    return {
      text: buffer.toString('utf-8'),
      imageUrls: [],
      formulas: [],
    };
  }

  // ============================================
  // OMML → formulalar ajratish
  // ============================================
  private extractFormulasFromDocx(buffer: Buffer): string[] {
    const formulas: string[] = [];

    try {
      const zip = new AdmZip(buffer);
      const documentXml = zip.readAsText('word/document.xml');

      const mathRegex = /<m:oMath>([\s\S]*?)<\/m:oMath>/g;
      let match;

      while ((match = mathRegex.exec(documentXml)) !== null) {
        const innerXml = match[1];
        const latex = this.ommlToLatex(innerXml);
        if (latex) formulas.push(latex);
      }
    } catch {
      // XML o'qib bo'lmasa o'tkazib yuboramiz
    }

    return formulas;
  }

  private ommlToLatex(xml: string): string {
    let result = xml;

    // 1. Kasr: \frac{num}{den}
    result = result.replace(
      /<m:f>[\s\S]*?<m:num>([\s\S]*?)<\/m:num>[\s\S]*?<m:den>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/g,
      (_, num, den) => {
        const n = this.extractMathText(num);
        const d = this.extractMathText(den);
        return `\\frac{${n}}{${d}}`;
      },
    );

    // 2. Daraja (ustki indeks): x^{n}
    result = result.replace(
      /<m:sSup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/g,
      (_, base, sup) => {
        const b = this.extractMathText(base);
        const s = this.extractMathText(sup);
        return `${b}^{${s}}`;
      },
    );

    // 3. Pastki indeks: x_{n}
    result = result.replace(
      /<m:sSub>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/g,
      (_, base, sub) => {
        const b = this.extractMathText(base);
        const s = this.extractMathText(sub);
        return `${b}_{${s}}`;
      },
    );

    // 4. Ustki va pastki indeks birga: x_{n}^{m}
    result = result.replace(
      /<m:sSubSup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSubSup>/g,
      (_, base, sub, sup) => {
        const b = this.extractMathText(base);
        const s = this.extractMathText(sub);
        const p = this.extractMathText(sup);
        return `${b}_{${s}}^{${p}}`;
      },
    );

    // 5. Ildiz: \sqrt{x} yoki \sqrt[n]{x}
    result = result.replace(
      /<m:rad>[\s\S]*?<m:deg>([\s\S]*?)<\/m:deg>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:rad>/g,
      (_, deg, base) => {
        const d = this.extractMathText(deg);
        const b = this.extractMathText(base);
        return d ? `\\sqrt[${d}]{${b}}` : `\\sqrt{${b}}`;
      },
    );

    // 6. Integral: \int_{a}^{b}
    result = result.replace(
      /<m:nary>[\s\S]*?<m:naryPr>[\s\S]*?<m:chr m:val="∫"[\s\S]*?<\/m:naryPr>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:nary>/g,
      (_, sub, sup, expr) => {
        const s = this.extractMathText(sub);
        const p = this.extractMathText(sup);
        const e = this.extractMathText(expr);
        return s && p ? `\\int_{${s}}^{${p}}{${e}}` : `\\int{${e}}`;
      },
    );

    // 7. Yig'indi: \sum_{i}^{n}
    result = result.replace(
      /<m:nary>[\s\S]*?<m:naryPr>[\s\S]*?<m:chr m:val="∑"[\s\S]*?<\/m:naryPr>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:nary>/g,
      (_, sub, sup, expr) => {
        const s = this.extractMathText(sub);
        const p = this.extractMathText(sup);
        const e = this.extractMathText(expr);
        return `\\sum_{${s}}^{${p}}{${e}}`;
      },
    );

    // 8. Ko'paytma: \prod_{i}^{n}
    result = result.replace(
      /<m:nary>[\s\S]*?<m:naryPr>[\s\S]*?<m:chr m:val="∏"[\s\S]*?<\/m:naryPr>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:nary>/g,
      (_, sub, sup, expr) => {
        const s = this.extractMathText(sub);
        const p = this.extractMathText(sup);
        const e = this.extractMathText(expr);
        return `\\prod_{${s}}^{${p}}{${e}}`;
      },
    );

    // 9. Limit: \lim_{x \to a}
    result = result.replace(
      /<m:func>[\s\S]*?<m:fName>([\s\S]*?)<\/m:fName>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:func>/g,
      (_, fname, expr) => {
        const f = this.extractMathText(fname);
        const e = this.extractMathText(expr);
        if (f.includes('lim'))
          return `\\lim_{${f.replace('lim', '').trim()}}{${e}}`;
        return `\\${f}{${e}}`;
      },
    );

    // 10. Hosila: f'(x) yoki \frac{d}{dx}
    result = result.replace(
      /<m:acc>[\s\S]*?<m:accPr>[\s\S]*?<m:chr m:val="′"[\s\S]*?<\/m:accPr>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:acc>/g,
      (_, expr) => {
        const e = this.extractMathText(expr);
        return `${e}'`;
      },
    );

    // 11. Mutlaq qiymat: |x|
    result = result.replace(
      /<m:d>[\s\S]*?<m:dPr>[\s\S]*?<m:begChr m:val="\|"[\s\S]*?<\/m:dPr>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:d>/g,
      (_, inner) => {
        const i = this.extractMathText(inner);
        return `|${i}|`;
      },
    );

    // 12. Matritsa: \begin{pmatrix}...\end{pmatrix}
    result = result.replace(/<m:m>([\s\S]*?)<\/m:m>/g, (_, inner) => {
      const rows: string[] = [];
      const rowRegex = /<m:mr>([\s\S]*?)<\/m:mr>/g;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(inner)) !== null) {
        const cells: string[] = [];
        const cellRegex = /<m:e>([\s\S]*?)<\/m:e>/g;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          cells.push(this.extractMathText(cellMatch[1]));
        }
        rows.push(cells.join(' & '));
      }
      return `\\begin{pmatrix}${rows.join(' \\\\ ')}\\end{pmatrix}`;
    });

    // 13. Umumiy nary (qolgan: lim, min, max va boshqalar)
    result = result.replace(
      /<m:nary>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:nary>/g,
      (_, sub, sup, expr) => {
        const s = this.extractMathText(sub);
        const p = this.extractMathText(sup);
        const e = this.extractMathText(expr);
        return s && p ? `_{${s}}^{${p}}{${e}}` : `{${e}}`;
      },
    );

    // Qolgan teglarni olib tashlash
    const text = result
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text ? `$${text}$` : '';
  }

  // <m:t> ichidagi matnni olish
  private extractMathText(xml: string): string {
    return [...xml.matchAll(/<m:t[^>]*>([\s\S]*?)<\/m:t>/g)]
      .map((m) => m[1])
      .join('')
      .trim();
  }

  // ============================================
  // RGBA buffer → PNG
  // ============================================
  private async rgbaToPng(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): Promise<Buffer> {
    const { createCanvas } = require('canvas');

    // 2x scale — sifatni oshirish uchun
    const SCALE = 2;
    const canvas = createCanvas(width * SCALE, height * SCALE);
    const ctx = canvas.getContext('2d');

    // Interpolation sifatini oshirish
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Avval original o'lchamda imageData yaratamiz
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    const imageData = tempCtx.createImageData(width, height);
    imageData.data.set(data);
    tempCtx.putImageData(imageData, 0, 0);

    // Keyin kattalashtirb asosiy canvas ga chizamiz
    ctx.drawImage(tempCanvas, 0, 0, width * SCALE, height * SCALE);

    return canvas.toBuffer('image/png');
  }
}
