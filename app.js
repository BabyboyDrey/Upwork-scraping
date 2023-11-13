const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const fs = require('fs')
const express = require('express')
const app = express()
const axios = require('axios')
const dotenv = require('dotenv')
// const smoothScroll = async (targetY,  duration)=> {
//   await page.evaluate((targetY, duration) => {
//     const initialY = window.scrollY;
//     const distance = Math.abs(targetY - initialY);
//     const startTime = Date.now();

//     return new Promise((resolve) => {
//       const scrollStep = () => {
//         const currentTime = Date.now();
//         const elapsedTime = currentTime - startTime;
//         const scrollFraction = Math.min(1, elapsedTime / duration);

//         window.scrollTo(0, initialY + distance * scrollFraction);

//         if (elapsedTime < duration) {
//           requestAnimationFrame(scrollStep);
//         } else {
//           resolve();
//         }
//       };

//       requestAnimationFrame(scrollStep);
//     });
//   }, targetY, duration);
// }
dotenv.config()

let browser

async function scrapeData () {
  try {
    browser = await puppeteer.launch({ headless: false, timeout: 100000 })
    const page = await browser.newPage()

    page.on('error', error => console.error(`Page error: ${error}`))

    await page.goto(
      'https://www.upwork.com/ab/account-security/login?redir=%2Fnx%2Ffind-work%2F',
      {
        timeout: 100000
      }
    )

    await page.waitForSelector('#login_username.air3-input', {
      visible: true,
      timeout: 100000
    })

    await page.type('#login_username.air3-input', 'darebabalola92@gmail.com')

    await page.click('#login_password_continue')

    // await page.evaluate(() => {
    // const passwordInput = document.querySelector('#login_password')
    // passwordInput.value = 'Abayomie84984'
    // })
    await page.waitForSelector('#login_password', { visible: true })

    await page.type('#login_password', 'Abayomie84984')

    await page.waitForSelector('#login_control_continue', { visible: true })
    await page.evaluate(() => {
      document.querySelector('#login_control_continue').click()
    })

    await page.waitForSelector(
      '.up-card-section.up-card-hover.d-flex.align-items-center',
      { visible: true, timeout: 100000 }
    )

    // page.on('console', (msg) => {
    //   for (let i = 0; i < msg.args().length; ++i)
    //     console.log(`${i}: ${msg.args()[i]}`);
    // });

    // await page.evaluate(() => {
    //   console.log('height:', document.body.scrollHeight);
    // });

    await page.waitForTimeout(300000)

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 1.3)
      console.log('height:', document.body.scrollHeight)
    })

    await page.waitForTimeout(40000)

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 3)
    })

    await page.waitForTimeout(40000)

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.25)
    })

    await page.waitForTimeout(40000)

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 8)
    })

    await page.waitForTimeout(40000)

    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })

    await page.waitForTimeout(40000)

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })

    const content = await page.content()
    const $ = cheerio.load(content)
    const jobArray = []
    const sections = $(
      'section.up-card-section.up-card-list-section.up-card-hover'
    )
    sections.each((i, itm) => {
      const title = $(itm).find('a.up-n-link').text()
      const budget = $(itm)
        .find('div.col-6.mb-10 > strong > span[data-itemprop="baseSalary"]')
        .text()
      const hoursPerWeek = $(itm)
        .find('div.col-6.mb-10 > strong[data-test="workload"]')
        .text()
      const totalDuration = $(itm)
        .find('div.col-6.mb-10 > strong[data-test="duration"]')
        .text()
      const extraInfo = $(itm)
        .find('div#up-line-clamp-v2-5 > span[data-test="job-description-text"]')
        .text()
      const skills = []
      const skill = $(itm)
        .find('div.up-skill-wrapper > span.up-skill-badge.text-muted')
        .each((i, itm) => {
          const item = $(itm).text()
          skills.push({ item })
        })
      const totalMoneySpent = $(itm)
        .find(
          'small.d-inline-block > strong > span[data-test="formatted-amount"]'
        )
        .text()

      jobArray.push({
        dateOfScraping: new Date(Date.now()).toDateString(),
        title,
        budget,
        hoursPerWeek,
        totalDuration,
        extraInfo,
        skills,
        totalMoneySpent
      })
    })

    fs.writeFileSync('./data.json', JSON.stringify(jobArray), 'utf-8')
  } catch (err) {
    console.log(`Error: ${err}`)
  } finally {
    if (browser) {
      await browser.close()
    }
    process.exit(1)
  }
}

app.get('/data', (req, res) => {
  try {
    const data = fs.writeFileSync('./data.json', 'utf-8')
    const parsedData = JSON.parse(data).sort((a, b) => {
      const dateA = new Date(a.dateOfScraping)
      const dateB = new Date(b.dateOfScraping)

      return dateB - dateA
    })
    res.status(200).json(parsedData)
  } catch (err) {
    res.status(500).json(`Error: err getting data, here's err details; ${err}`)
  }
})

app.listen(process.env.PORT, async (req, res) => {
  console.log(`server list on ${process.env.PORT}`)

  await scrapeData()
  console.log('Data scraped scuccessful')
})

app.get('/', async (req, res) => {
  res.send(`Data scraping successful, hit '/data' to see data`)
})
