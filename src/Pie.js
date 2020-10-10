import React, { useEffect, useState } from 'react'
import SvgIcon from '@material-ui/core/SvgIcon'
const r = 11
const center = { x: 12, y: 12 }
const SVG_EPSILON = 0.000001
export default ({angle, animationDuration, framesPerSecond, ...props}) => {
  angle = angle <= SVG_EPSILON
    ? SVG_EPSILON
    : angle >= 2 * Math.PI - SVG_EPSILON
    ? 2 * Math.PI - SVG_EPSILON
    : angle
  animationDuration = animationDuration !== undefined ? animationDuration : 0.5
  framesPerSecond = framesPerSecond !== undefined ? framesPerSecond : 20
  const animationIterations = animationDuration * framesPerSecond
  const [ currentAngle, setCurrentAngle ] = useState(0)
  useEffect(() => {
    // setCurrentAngle(0)
    const angleIncrement = (angle - currentAngle) / animationIterations
    const interval = setInterval(
      () => {
        setCurrentAngle(currentAngle => {
          if (angleIncrement > 0 && currentAngle + angleIncrement >= angle || angleIncrement < 0 && currentAngle + angleIncrement <= angle) {
            clearInterval(interval)
          }
          return currentAngle + angleIncrement
        })
      },
      1000 / framesPerSecond)
    return () => clearInterval(interval)
  }, [angle, setCurrentAngle])
  return <SvgIcon {...props} >
    <path
      d={`M 12,1 A 11,11 0 ${currentAngle > Math.PI ? 1 : 0} 1 ${ r * Math.sin(currentAngle) + center.x },${ - r * Math.cos(currentAngle) + center.y } L 12,12 Z`} />
    <path
      style={{opacity: 0.2}}
      d={`M ${ r * Math.sin(currentAngle) + center.x },${ - r * Math.cos(currentAngle) + center.y } A 11,11 0 ${currentAngle > Math.PI ? 0 : 1} 1 12,1 L 12,12 Z`} />
  </SvgIcon>
}