export const formatDecimal = (value: number, specialChar: string = '%') => {
    if (value < 0.01 && value > 0) {
      return `0.1${specialChar}`;
    }
    if (value > 0.99 && value < 1) {
      return `>99${specialChar}`;
    }
    if (value >= 1) {
      return `99${specialChar}`;
    }
    return `${Math.round(value * 100)}${specialChar}`;
  };
  
export const formatVolume = (volumeStr: string) => {
    const num = parseFloat(volumeStr);
    if (isNaN(num)) return '$0';
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
};