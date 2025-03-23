const lowercase = "abcdefghijklmnopqrstuvwxyz"
const uppercase = lowercase.toUpperCase()
const letters = lowercase + uppercase
const digits = "0123456789"
const lettersAndDigits = letters + digits

const getRandomLetter = () => {
  return letters.charAt(Math.floor(Math.random() * letters.length))
}

const getRandomLetterOrDigit = () => {
  return lettersAndDigits.charAt(Math.floor(Math.random() * lettersAndDigits.length))
}

const getId = () => {
  // In CSS ids must start with a letter, so make sure all start like that
  let id = getRandomLetter()
  for (let i = 0; i < 9; i += 1) {
    id += getRandomLetterOrDigit()
  }
  return id
}

export default getId
