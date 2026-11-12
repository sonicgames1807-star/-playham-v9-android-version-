// Normalized row boundaries of the illustrated sheet (the rows are not a 10x10 grid).
const rows = [
  [0,145, ['Роза','Лилия','Сакура','Подсолнух','Лотос','Гибискус','Ирис','Пион']],
  [145,285, ['Дуб','Клён','Гинкго','Монстера','Венок','Клевер','Плющ','Папоротник','Олива']],
  [285,420, ['Бабочка','Мотылёк','Лунный мотылёк','Стрекоза','Пчела','Жук','Божья коровка','Паук','Улитка','Скорпион']],
  [420,545, ['Луна','Луна со звездой','Полнолуние','Три луны','Солнце','Звезда','Искра','Созвездие','Галактика','Сатурн']],
  [545,670, ['Сердце','Горящее сердце','Стрела','Два сердца','Узел','Бесконечность','Сияние','Орнамент','Подвеска','Звёздный знак']],
  [670,805, ['Ласточка','Голубь','Колибри','Птица','Сова','Кошка','Кошка потягивается','Спящая кошка','Волк','Олень']],
  [805,935, ['Карп','Бойцовая рыбка','Золотая рыбка','Акула','Дельфин','Кит','Осьминог','Морской конёк','Черепаха','Скат']],
  [935,1050, ['Змея','Уроборос','Грибы','Мухомор','Кристаллы','Алмаз','Кварц','Зелье','Часы','Фонарь']],
  [1050,1150, ['Горы','Лес','Волна','Облака','Рассвет','Молния','Снежинка','Пламя','Корона','Замок']],
  [1150,1254, ['Ключ','Замок сердца','Кинжал','Мечи','Ладонь','Молитва','Глаз','Всевидящее око','Перо','Ракушка']],
]
const boundaries = [
  [0,155,315,474,632,788,943,1099,1254],
  [0,149,305,465,613,782,902,1015,1112,1254],
  [0,145,292,424,550,678,782,903,1011,1137,1254],
  [0,111,226,358,497,625,761,871,997,1120,1254],
  [0,108,242,377,497,615,751,864,1008,1094,1254],
  [0,119,258,379,488,606,717,858,993,1109,1254],
  [0,118,240,358,501,619,747,897,983,1124,1254],
  [0,107,252,377,497,629,759,881,992,1108,1254],
  [0,160,274,419,548,661,787,902,996,1121,1254],
  [0,97,228,368,504,621,733,875,999,1123,1254],
]
export async function loadBuiltins() {
  const image = new Image()
  image.src = `${import.meta.env.BASE_URL}catalog-sheet.png`
  await image.decode()
  const sheet = document.createElement('canvas')
  sheet.width = image.naturalWidth; sheet.height = image.naturalHeight
  const sheetContext = sheet.getContext('2d', { willReadFrequently: true })
  sheetContext.drawImage(image, 0, 0)
  const raw = sheetContext.getImageData(0, 0, sheet.width, sheet.height).data
  const dark = (x, y) => {
    const i = (y * sheet.width + x) * 4
    return (raw[i] + raw[i + 1] + raw[i + 2]) / 3 < 180 && raw[i + 3] > 100
  }
  const safe = (left, top, right, bottom) => {
    let borderInk = 0
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      if ((x < left + 4 || x >= right - 4 || y < top + 4 || y >= bottom - 4) && dark(x, y)) borderInk++
    }
    return borderInk <= 8
  }
  return rows.flatMap(([top, bottom, names], row) => names.map((name, column) => {
    const left = boundaries[row][column]
    const right = boundaries[row][column + 1]
    if (!safe(left, top, right, bottom)) return null
    const width = (right - left) / 1254 * image.naturalWidth
    const height = (bottom - top) / 1254 * image.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 320
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const scale = 296 / Math.max(width, height)
    context.drawImage(image, left / 1254 * image.naturalWidth, top / 1254 * image.naturalHeight, width, height, (320 - width * scale) / 2, (320 - height * scale) / 2, width * scale, height * scale)
    const pixels = context.getImageData(0, 0, 320, 320)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const brightness = (pixels.data[i] + pixels.data[i+1] + pixels.data[i+2]) / 3
      pixels.data[i+3] = Math.min(pixels.data[i+3], Math.max(0, (245-brightness)*2))
    }
    context.putImageData(pixels,0,0)
    return { id: `builtin-${row}-${column}`, name, source: canvas.toDataURL() }
  })).filter(Boolean)
}
