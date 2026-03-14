export const buildImportPrompt = (
  text: string,
  imageUrls: string[],
  formulas: string[],
) => {
  const truncatedText =
    text.length > 12000
      ? text.slice(0, 12000) + '\n...[matn qisqartirildi]'
      : text;

  return `
Sen test savollari tahlilchisisан.
Quyidagi ma'lumotlardan test savollarini ajratib ol va FAQAT JSON formatida qaytар.

MUHIM QOIDALAR:
1. Faqat JSON qaytар — boshqa hech narsa yozma
2. Formulalarni LaTeX formatida yoz: $formula$
3. Agar savolda rasm bo'lsa, imageUrl ga mos URL ni qo'y
4. "(rasmga qarang)" kabi iboralarni o'zgartirma — shundayligicha qoldur
5. Kamida 1 ta to'g'ri javob bo'lsin

${
  formulas.length > 0
    ? `
=== FORMULALAR (LaTeX ga o'gir) ===
${formulas.join('\n')}
`
    : ''
}

${
  imageUrls.length > 0
    ? `
=== RASM URLlar ===
${imageUrls.map((url, i) => `[${i}]: ${url}`).join('\n')}
`
    : ''
}

JSON FORMATI:
[
  {
    "questionText": "Savol matni $formula$ bilan",
    "questionType": "single",
    "imageUrl": "https://...",
    "answerOptions": [
      { "optionLabel": "A", "optionText": "variant", "isCorrect": false },
      { "optionLabel": "B", "optionText": "variant", "isCorrect": true },
      { "optionLabel": "C", "optionText": "variant", "isCorrect": false },
      { "optionLabel": "D", "optionText": "variant", "isCorrect": false }
    ]
  }
]

=== MATN ===
${truncatedText}
`;
};

export const buildMultimodalPrompt = () => `
Sen test savollari tahlilchisisan.
Ushbu fayldan test savollarini ajratib ol va FAQAT JSON formatida qaytar.

MUHIM QOIDALAR:
1. Faqat JSON qaytar — boshqa hech narsa yozma
2. Formulalarni LaTeX formatida yoz: $formula$
3. Har bir savolda kamida 2, ko'pi bilan 6 ta variant bo'lsin
4. Kamida 1 ta to'g'ri javob bo'lsin
5. Rasmli savollar uchun questionText ga "[RASM]" yoz
6. Agar savol aniqlanmasa — bo'sh array qaytar

JSON FORMATI:
[
  {
    "questionText": "Savol matni",
    "questionType": "single",
    "answerOptions": [
      { "optionLabel": "A", "optionText": "Variant matni", "isCorrect": false },
      { "optionLabel": "B", "optionText": "Variant matni", "isCorrect": true },
      { "optionLabel": "C", "optionText": "Variant matni", "isCorrect": false },
      { "optionLabel": "D", "optionText": "Variant matni", "isCorrect": false }
    ]
  }
]
`;
