const GRADIENTS = [
  ['#FF9A9E', '#FECFEF'], // 溫暖粉櫻
  ['#A1C4FD', '#C2E9FB'], // 清新晴空
  ['#8FD3F4', '#84FAB0'], // 翠玉春水
  ['#A6C0FE', '#F68084'], // 夢幻夕陽
  ['#FDA085', '#F6D365'], // 活力暖橙
  ['#E0C3FC', '#8EC5FC'], // 優雅紫羅蘭
  ['#4FACFE', '#00F2FE'], // 蔚藍深海
  ['#FAD0C4', '#FFD1FF'], // 蜜桃薔薇
  ['#43E97B', '#38F9D7'], // 薄荷青草
  ['#FA709A', '#FEE140'], // 璀璨晨曦
  ['#30CFD0', '#330867'], // 幻星深紫
  ['#F093FB', '#F5576C']  // 濃情玫瑰
]

const PATTERNS = [
  // 1. 太陽花 / 幾何星
  `<path d="M50 22 L57 39 L75 39 L61 50 L67 67 L50 56 L33 67 L39 50 L25 39 L43 39 Z" fill="white" opacity="0.85"/>`,
  // 2. 雙重同心圓
  `<circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="4" opacity="0.75"/><circle cx="50" cy="50" r="9" fill="white" opacity="0.85"/>`,
  // 3. 旋轉方塊
  `<rect x="33" y="33" width="34" height="34" rx="6" transform="rotate(45 50 50)" fill="white" opacity="0.8"/>`,
  // 4. 沙漏幾何
  `<path d="M32 32 L68 32 L50 50 Z" fill="white" opacity="0.75"/><path d="M32 68 L68 68 L50 50 Z" fill="white" opacity="0.85"/>`,
  // 5. 優雅圓弧組合
  `<circle cx="50" cy="50" r="22" fill="none" stroke="white" stroke-width="3" opacity="0.6" stroke-dasharray="10 5"/>`,
  // 6. 三重幾何三角形
  `<polygon points="50,26 71,64 29,64" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round" opacity="0.8"/>`
]

const generateRandomAvatar = async (_targetSize: number) => {
  const grad = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)]
  const pat = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
  const angle = Math.floor(Math.random() * 360)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad-${angle}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
        <stop offset="0%" stop-color="${grad[0]}" />
        <stop offset="100%" stop-color="${grad[1]}" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#grad-${angle})" />
    ${pat}
  </svg>`

  const base64 = btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}

export default generateRandomAvatar
