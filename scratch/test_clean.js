const textOutput = "```json\n{\n  \"titulo\": \"A\",\n  \"slug\": \"a\",\n  \"contenido_markdown\": \"Código: ```bash\\n npm install \\n```\"\n}\n```";

let cleanText = textOutput.trim();
if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
} else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
}
if (cleanText.endsWith('```')) {
    cleanText = cleanText.substring(0, cleanText.length - 3);
}
cleanText = cleanText.trim();

try {
  const parsedData = JSON.parse(cleanText);
  console.log("Success:", parsedData);
} catch (e) {
  console.error("Error:", e);
}
