// lib/scraper.ts
import * as cheerio from 'cheerio'

export interface ScrapedLaw {
  title: string
  lawNumber?: string
  publishedDate?: Date
  sourceUrl: string
  pdfUrl?: string
  fullText?: string
}

// ดึงข้อมูลจากราชกิจจานุเบกษา
export async function scrapeRoyalGazette(): Promise<ScrapedLaw[]> {
  const laws: ScrapedLaw[] = []

  try {
    // ค้นหากฎหมายความปลอดภัย
    const searchUrl =
      '[ratchakitcha.soc.go.th](https://ratchakitcha.soc.go.th/search-result?keyword=ความปลอดภัย&type=law)'

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LawComplianceBot/1.0)',
      },
    })

    if (!response.ok) {
      console.error('Royal Gazette fetch failed:', response.status)
      return laws
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Parse ผลการค้นหา (ปรับ selector ตามโครงสร้างจริง)
    $('.search-result-item').each((_, element) => {
      const title = $(element).find('.title').text().trim()
      const link = $(element).find('a').attr('href')
      const dateText = $(element).find('.date').text().trim()

      if (title && link) {
        laws.push({
          title,
          sourceUrl: link.startsWith('http')
            ? link
            : `[ratchakitcha.soc.go.th${link}](https://ratchakitcha.soc.go.th${link})`,
          publishedDate: dateText ? parseThaiDate(dateText) : undefined,
        })
      }
    })
  } catch (error) {
    console.error('Error scraping Royal Gazette:', error)
  }

  return laws
}

// ดึงข้อมูลจากกรมสวัสดิการและคุ้มครองแรงงาน
export async function scrapeLabourWelfare(): Promise<ScrapedLaw[]> {
  const laws: ScrapedLaw[] = []

  try {
    const baseUrl = '[labour.go.th](https://www.labour.go.th)'
    const lawPageUrl = `${baseUrl}/law`

    const response = await fetch(lawPageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LawComplianceBot/1.0)',
      },
    })

    if (!response.ok) {
      console.error('Labour Welfare fetch failed:', response.status)
      return laws
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Parse รายการกฎหมาย
    $('.law-item, .document-item').each((_, element) => {
      const title = $(element).find('h3, .title, a').first().text().trim()
      const link = $(element).find('a').attr('href')
      const pdfLink = $(element).find('a[href$=".pdf"]').attr('href')

      if (title) {
        laws.push({
          title,
          sourceUrl: link
            ? link.startsWith('http')
              ? link
              : `${baseUrl}${link}`
            : lawPageUrl,
          pdfUrl: pdfLink
            ? pdfLink.startsWith('http')
              ? pdfLink
              : `${baseUrl}${pdfLink}`
            : undefined,
        })
      }
    })
  } catch (error) {
    console.error('Error scraping Labour Welfare:', error)
  }

  return laws
}

// ดึงเนื้อหา PDF (ต้องใช้ pdf-parse)
export async function extractPdfText(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) return ''

    const buffer = await response.arrayBuffer()

    // Dynamic import เพื่อหลีกเลี่ยงปัญหา edge runtime
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(Buffer.from(buffer))

    return data.text
  } catch (error) {
    console.error('Error extracting PDF:', error)
    return ''
  }
}

// แปลงวันที่ภาษาไทย
function parseThaiDate(dateStr: string): Date | undefined {
  try {
    const thaiMonths: Record<string, number> = {
      มกราคม: 0,
      กุมภาพันธ์: 1,
      มีนาคม: 2,
      เมษายน: 3,
      พฤษภาคม: 4,
      มิถุนายน: 5,
      กรกฎาคม: 6,
      สิงหาคม: 7,
      กันยายน: 8,
      ตุลาคม: 9,
      พฤศจิกายน: 10,
      ธันวาคม: 11,
    }

    // รูปแบบ: 15 มกราคม 2567
    const match = dateStr.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/)
    if (match) {
      const day = parseInt(match[1])
      const month = thaiMonths[match[2]]
      const year = parseInt(match[3]) - 543 // แปลง พ.ศ. เป็น ค.ศ.

      if (month !== undefined) {
        return new Date(year, month, day)
      }
    }
  } catch (error) {
    console.error('Error parsing Thai date:', error)
  }
  return undefined
}
