import React from 'react'
import SvgIcon from '@material-ui/core/SvgIcon'
const r = 11
const center = { x: 12, y: 12 }
export default ({angle, ...props}) => <SvgIcon {...props} >
    <path
        d={`M 12,1 A 11,11 0 ${angle > Math.PI ? 1 : 0} 1 ${ r * Math.sin(angle) + center.x },${ - r * Math.cos(angle) + center.y } L 12,12 Z`} />
    <path
        style={{opacity: 0.2}}
        d={`M ${ r * Math.sin(angle) + center.x },${ - r * Math.cos(angle) + center.y } A 11,11 0 ${angle > Math.PI ? 0 : 1} 1 12,1 L 12,12 Z`} />
  </SvgIcon>