export const generateGradient = (name: string) => {
  // Get the first letter's ASCII code
  const charCode = name.charCodeAt(0);
  
  // Generate colors based on the ASCII code
  const hue1 = (charCode * 137) % 360; // Golden angle approximation
  const hue2 = (hue1 + 120) % 360; // Complementary color
  
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`;
}; 