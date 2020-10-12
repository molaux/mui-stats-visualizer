/**
 * Given an object and an array properties, resolves o[array[0]][array[1]][...]
 * array properties must be referenced as 'prop[i]' in keyChain
 * @param {object} o the object to dereference
 * @param {array} keyChain The properties chain
 * @return {object} The resolved object 
 */
export const resolveObjectKeyChain = (o, keyChain) => keyChain
  .reduce((ro, property) => {
    if (property.slice(-1) === ']') {
      const openTokenIndex = property.indexOf('[')
      const arrayName = property.substring(0, openTokenIndex)
      const index =  property.substring(openTokenIndex + 1, property.length - 1)
      const value = ro[arrayName][index]
      return value === undefined ? 0 : value
    } else {
      const value = ro[property]
      return value === undefined ? 0 : value
    }
  }, o)