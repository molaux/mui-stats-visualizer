export default level => ({
  log: (...logs) => level === 'none' || level === 'error' || console.log(`${new Date()}:`, ...logs),
  debug: (...logs) => level === 'none' || level === 'error' || level === 'log'  || level === 'notice' || console.log(`${new Date()}:`, ...logs),
  error: (...logs) => level === 'none' || console.log(`${new Date()}:`, ...logs)
})