// Word count
export const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Character count
export const countCharacters = (text) => {
  if (!text) return 0;
  return text.length;
};

// Paragraph count
export const countParagraphs = (text) => {
  if (!text) return 0;
  return text.split(/\n+/).filter((p) => p.trim().length > 0).length;
};

// Reading time
export const estimateReadingTime = (text) => {
  const words = countWords(text);
  const minutes = Math.ceil(words / 200);
  return minutes;
};

// Duplicate skill detection
export const findDuplicateSkills = (skills) => {
  const seen = {};
  const duplicates = [];
  skills.forEach((skill) => {
    const lower = skill.trim().toLowerCase();
    if (seen[lower]) {
      duplicates.push(skill);
    } else {
      seen[lower] = true;
    }
  });
  return duplicates;
};

// Auto capitalize
export const autoCapitalize = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Get all resume text combined for analytics
export const getFullResumeText = (formData) => {
  const parts = [
    formData.full_name || "",
    formData.summary || "",
    ...(formData.education || []).map(
      (e) => `${e.institution} ${e.degree} ${e.year}`
    ),
    ...(formData.experience || []).map(
      (e) => `${e.company} ${e.role} ${e.duration} ${e.description}`
    ),
    ...(formData.skills || []),
    ...(formData.projects || []).map(
      (p) => `${p.name} ${p.description} ${p.technologies}`
    ),
  ];
  return parts.join(" ");
};