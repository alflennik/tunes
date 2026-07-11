const shorthand = (
  // ["file",
  //   ["assign",
  //     ["variable", "someNumber"],
  //     ["add", ["number", 1], ["number", 1]]
  //   ]
  // ]
  ["file",
    ["assign",
      ["variable", "buildingHeights"],
      ["dataset", ["number", 5], ["number", 7], ["number", 2], ["number", 1]]
    ],

    ["assign",
      ["variable", "answer"],
      ["statements",
        ["assign",
          ["flexibleVariable", "largestHeightSoFar"],
          ["number", 0]
        ],
        ["call", 
          ["read",
            ["call", ["read", ["variable", "buildingHeights"], ["name", "reversed"]]],
            ["name", "each"],
          ],
          ["variable", "height"]
        ]
      ],
    ],
  ]
)

const convertShorthandToUi = (shorthand) => {
  const recursiveConversion = ([name, ...args]) => {
    let nameFormatted
    switch (name) {
      case 'assign':
        nameFormatted = 'Assign data to variable'
        break
      case 'flexibleVariable':
        nameFormatted = 'Flexible variable'
        break
      case 'read':
        nameFormatted = 'Read the data inside a variable'
        break
      case 'call':
        nameFormatted = 'Trigger an action'
        break
      default:
        if (!name) debugger
        nameFormatted = [name.slice(0, 1).toUpperCase(), ...name.slice(1)].join('')
        break
    }
    
    
    switch (name) {
      case 'variable':
      case 'flexibleVariable':
      case 'name':
        console.log(args)
        return `
          <div class="option">
            <div class="option-name">${nameFormatted} ${dropdownIcon}</div>
            <div class="string">${convertVariableName(args[0])}</div>
          </div>
        `
      case 'string':
        return `
          <div class="option">
            <div class="option-name">${nameFormatted} ${dropdownIcon}</div>
            <div class="string">${args[0]}</div>
          </div>
        `
      case 'number':
        return `
          <div class="option">
            <div class="option-name">${nameFormatted} ${dropdownIcon}</div>
            <div class="number">${args[0]}</div>
            </div>
            `
      case 'assign':
      case 'add':
      default:
        return `
          <div class="option">
            <div class="option-name">${nameFormatted} ${dropdownIcon}</div>
            ${args.map(arg => recursiveConversion(arg)).join('')}
          </div>
        `
    }
  }

  return recursiveConversion(shorthand)
}

const convertVariableName = (variableName) => {
  const formattedWords = []
  let currentWord = ''

  variableName.split('').forEach((letter, index) => {
    if (index === 0) {
      currentWord += letter.toUpperCase()
    } else if (letter.match(/[A-Z0-9]/)) {
      formattedWords.push(currentWord)
      currentWord = letter
    } else {
      currentWord += letter
    }
  })

  if (currentWord) formattedWords.push(currentWord)

  return formattedWords.join(' ')
}

const dropdownIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="64" height="64" viewBox="0 0 616 614"><path fill="currentColor" d="m602.442 200l-253 317c-24 29-61 29-84 0l-253-317c-24-30-12-53 25-53h540c38 0 49 23 25 53"></path></svg>
`

const html = convertShorthandToUi(shorthand)
document.body.innerHTML = html