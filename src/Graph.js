import React, { Component } from 'react'
import { Route, withRouter } from 'react-router-dom'

import { DataViz } from './DataViz'

import strtotime from 'locutus/php/datetime/strtotime'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import Input from '@material-ui/core/Input'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'

import useMediaQuery from '@material-ui/core/useMediaQuery'

import Color from 'color'

import { LocalizationProvider } from '@material-ui/pickers'

import Divider from '@material-ui/core/Divider'

import TableSelect from './TableSelect'

import HourIcon from '@material-ui/icons/AccessTime'
import DayIcon from '@material-ui/icons/ViewDay'
import WeekIcon from '@material-ui/icons/ViewWeek'
import MonthIcon from '@material-ui/icons/CalendarToday'
import YearIcon from '@material-ui/icons/ViewArray'

import DateFnsUtils from '@date-io/date-fns'
import frLocale from "date-fns/locale/fr"

import gql from 'graphql-tag'
import { graphql } from '@apollo/react-hoc'

import { withStyles, MuiThemeProvider } from '@material-ui/core/styles'
import ggChartColors from './ChartColors'
import plural from 'pluralize-fr'

import { createMuiTheme } from '@material-ui/core'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
  typography: {
    useNextVariants: true,
  }
})

import loggerGenerator from './utils/logger'
import { DateTimeChip, AddDateTimeChip } from './DateTimeChip'
const logger = loggerGenerator('error')

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const GRAPH_TINY_RATIO = 0.7
const GRAPH_WIDE_RATIO = 0.3

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

function getStyles(key, keys, theme) {
  return {
    fontWeight:
      keys.indexOf(key) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  }
}

const styles = theme => {
  console.log(theme)
  return ({
  graph: {
    position: 'relative',
    marginTop: 0,
    boxSizing: 'border-box',
  },
  pie: {
    fontSize: 10
  },
  toolbar: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '& > *': {
      marginLeft: theme.spacing(2)
    }
  },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(6px)',
    padding: theme.spacing(0, 0.5, 0.5, 0.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    fontSize: '0.8em',
    '& td': {
      padding: theme.spacing(0.5, 1, 0.5, 1)
    },
    '& tr:last-child td': {
      borderBottom: 0
    }
  },
  formControl: {
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1)
    },
    boxSizing: 'border-box',
  },
  numberField: {
    '& input[type=number]': {
      textAlign: 'right',
      paddingRight: theme.spacing(2),
      width: '5em',
      '-webkit-appearance': 'textfield',
      '-moz-appearance': 'textfield',
      'appearance': 'textfield',
      '&::-webkit-inner-spin-button,&::-webkit-outer-spin-button': { 
        '-webkit-appearance': 'none'
      }
    }
  },
  selectButton: {
    paddingLeft: theme.spacing(2), 
    borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0!important`,
    backgroundColor: theme.palette.primary.main,
    '&:before': {
      borderBottom: 0
    },
    '&:after': {
      borderBottom: 0
    },
    '&:active': {
      borderBottom: 0
    },
    '&:hover:before': {
      borderBottom: '0!important'
    },
    '&:hover:after': {
      borderBottom: '0!important'
    },
    '&:active:before': {
      borderBottom: '0!important'
    },
    '&:active:after': {
      borderBottom: '0!important'
    },
  },
  radioGroup: {
    margin: theme.spacing(1, 0),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5)
    }
  },
  paddedContent: {
    position: 'relative',
    boxSizing: 'border-box',
    minWidth: '100%',
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 0,
      paddingRight: 0
    },
  },
  ratioContainer: {
    paddingBottom: `${Math.round(GRAPH_WIDE_RATIO*100)}%`, /* width/height Ratio */
    position: 'relative',
    height: 0,
    [theme.breakpoints.down('md')]: {
      paddingBottom: `${Math.round(GRAPH_TINY_RATIO*100)}%`, /* width/height Ratio */
    },
  },
  fullContainer: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  }
})}

const STATS_QUERY = gql`
  query Statistics($granularity: String!, $duration: String!, $series: [DimensionType!]) {
    statistics(granularity: $granularity, duration: $duration, series: $series)
  }
`

class Graph extends Component {
  constructor(props) {
    super(props);
    const { autoConfigs, defaultConfig, defaultGranularity, defaultDurationUnit, defaultDurationAmount, defaultKeys, defaultGraphType, defaultGraphStack, defaultGraphView } = this.props
    this.state = {
      granularity: defaultGranularity || (autoConfigs[defaultConfig].granularity ? autoConfigs[defaultConfig].granularity : 'day'),
      graphType: defaultGraphType || 'line',
      graphView: defaultGraphView || 'value',
      graphStack: defaultGraphStack !== undefined && defaultGraphStack !== null ? defaultGraphStack : false,
      keys: defaultKeys || [],
      dimensions: {},
      autoConfig: defaultConfig,
      durationUnit: defaultDurationUnit || autoConfigs[defaultConfig].durationUnit,
      durationAmount: defaultDurationAmount || autoConfigs[defaultConfig].durationAmount,
      dates: autoConfigs[defaultConfig].dates()
    }
    logger.log('V: init')

  }
  
  generateColors (keys) {
    let i = 0
    return keys.reduce((colors, key) => {
        colors[key] = ggChartColors[i++ % ggChartColors.length]
        return colors
      },
      {})
  }

  handleChangeKeys (event) {
    this.setState({ keys: Array.isArray(event) ? event : event.target.value })
    if (typeof this.props.onDimensionsSelectionChange === 'function') {
      this.props.onDimensionsSelectionChange(Array.isArray(event) ? event : event.target.value)
    }
  }

  dateFormatter(granularity) {
    switch (granularity) {
      case 'hour': return 'EEE dd/MM/yyyy, HH:mm'
      case 'day': return 'EEE dd/MM/yyyy'
      case 'week': return 'RRRR\', semaine \'II'
      case 'month': return 'MM/yyyy'
      case 'year': return 'yyyy'
      default: throw Error(`Granularity ${granularity} should be hour, day, week, month or year`)
    }
  }

  handleChangeGraphType(value) {
    this.setState({ graphType: value })
    if (typeof this.props.onGraphTypeChange === 'function') {
      this.props.onGraphTypeChange(value)
    }
  }

  handleChangeGraphView(value) {
    this.setState({ graphView: value })
    if (typeof this.props.onGraphViewChange === 'function') {
      this.props.onGraphViewChange(value)
    }
  }

  handleChangeGraphStack(checked) {
    this.setState({ graphStack: checked })
    if (typeof this.props.onGraphStackChange === 'function') {
      this.props.onGraphStackChange(checked)
    }
  }

  handleChangeGranularity(value) {
    this.setState({ granularity: value })
    if (typeof this.props.onGranularityChange === 'function') {
      this.props.onGranularityChange(value)
    }
  }

  handleChangeDurationAmount (event) {
    if (event.target.value !== '' && !isNaN(parseInt(event.target.value, 10))) {
      this.setState({
        autoConfig: null,
        durationAmount: event.target.value
      })
      if (typeof this.props.onDurationAmountChange === 'function') {
        this.props.onDurationAmountChange(parseInt(event.target.value, 10))
      }
    }
  }
  
  handleChangeDurationUnit (event) {
    this.setState({
      autoConfig: null,
      durationUnit: event.target.value
    })
    if (typeof this.props.onDurationUnitChange === 'function') {
      this.props.onDurationUnitChange(event.target.value)
    }
  }

  handleChangeAutoconfig (event) {
    const { autoConfigs } = this.props
    this.setState({
      granularity:  autoConfigs[event.target.value].granularity,
      durationUnit: autoConfigs[event.target.value].durationUnit,
      durationAmount: autoConfigs[event.target.value].durationAmount,
      dates: autoConfigs[event.target.value].dates(),
      autoConfig: event.target.value
    })
    if (typeof this.props.onAutoconfigChange === 'function') {
      this.props.onAutoconfigChange(event.target.value)
    }
  }

  handleChangeDate(j, date, ...rest) {
    this.setState(({dates}) => {
      let datesCopy = Array.from(dates)
      datesCopy[j] = date
      datesCopy = datesCopy.sort((a, b) => a.getTime() - b.getTime())
      return { 
        dates: datesCopy,
        autoConfig: null
      }
    })
  }

  handleAddDate() {
    this.setState(({dates, durationAmount, durationUnit}) => {
      let datesCopy = Array.from(dates)
      datesCopy.unshift(new Date(strtotime(`-${durationAmount} ${durationUnit}`, dates[0].getTime() / 1000) * 1000))
      return {
        autoConfig: null,
        dates: datesCopy
      }
    })
  }

  handleDeleteDate(j) {
    this.setState(state => state.dates.length > 1 
      ? {
        autoConfig: null,
        dates: state.dates.filter((_, i) => i !== j)
      }
      : {
        autoConfig: null,
        dates: [ new Date(strtotime(`-${state.durationAmount} ${state.durationUnit}`) * 1000) ]
      })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    logger.log('V: did update')
    if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
      logger.log('V: pushing new url', `${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
      this.props.history.push(`${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    logger.log(
      'V: shouldUpdate?',
      JSON.stringify(nextState),
      JSON.stringify(this.state),
      JSON.stringify(nextState) !== JSON.stringify(this.state) || nextProps.dimensions !== this.props.dimensions)
    
    return JSON.stringify(nextState) !== JSON.stringify(this.state)
      || nextProps.dimensions !== this.props.dimensions
      || nextProps.smUpWidth !== this.props.smUpWidth;
  }

  static getDerivedStateFromProps(props, state) {
    logger.log('V: gdsfp - ', state.keys.length === 0)
    return {
        ...state,
        keys: state.keys.length === 0 ? Object.keys(props.dimensions).slice(0, 1) : state.keys,
      }
  }

  componentDidMount () {
    logger.log('V: did mount', this.props.match)
    let urlConfiguration = {}
    if (this.props.match && this.props.match.params.configuration) {
      logger.log('V: did mount with config')

      urlConfiguration = JSON.parse(decodeURIComponent(this.props.match.params.configuration))
      if (Array.isArray(urlConfiguration.dates)) {
        urlConfiguration.dates = urlConfiguration.dates.map(strDate => new Date(strDate))
      }
      this.setState(state => ({
        ...state,
        ...urlConfiguration
      }))
    } else {
      logger.log('V: pushing new url', `${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
      this.props.history.push(`${this.props.prefixPath}/${encodeURIComponent(JSON.stringify(this.state))}`)
    }
  }

  /**
   * this.props.dimensions = {
   *   [category_dimension]: { // the dimension key
   *     group: { // defines the group to witch dimension belongs to
   *       depth, // sets the level of category
   *       label, // sets the label of the category
   *       dimension, // sets the label of the dimension
   *       key, // the group key
   *     },
   *     title, // the dimension detailed title as displayed (for legends and  tooltips)
   *     type, // a type of data (currency, ...)
   *     reducer, // a function to be applyed on whole serie and compute summary  (eg, avg or sum)
   * 
   *     // Optional virtual dimensions definition based on other dimensions
   *     series, // an array of dimension to be based on
   *     f: o => f(o), // a function to apply on dimensions and compute the  virtual dimension
   *   }
   * }
   */
  render() { 
    let { classes, graphOptions, theme, dimensionsSelector, autoConfigs, timeAggregations, smUpWidth } = this.props
    if ( !graphOptions ) {
      graphOptions = { serieType: 'linear' }
    }

    if ( !timeAggregations ) {
      timeAggregations = {
        hour: { value: 'Heure', icon: HourIcon },
        day: { value: 'Jour', icon: DayIcon },
        week: { value: 'Semaine', icon: WeekIcon },
        month: { value: 'Mois', icon: MonthIcon },
        year: { value: 'An', icon: YearIcon }
      }
    }
    
    if ( !graphOptions.serieType ) {
      graphOptions.serieType = 'linear'
    }
    
    if ( !graphOptions.formatters ) {
      graphOptions.formatters = {}
    }

    const { keys, dates } = this.state
    // Retrieve real dimensions involve, even in virtual dimensions
    const expandedKeys = [... new Set(keys.map(key => this.props.dimensions[key].series !== undefined 
      ? this.props.dimensions[key].series
      : key)
      .flat())]

    // Create series from start dates / dimensions
    const series = dates.map(date => ({
        from: date.toISOString(),
        dimensions: expandedKeys
      }))
    
    // Generate colors
    const mostRecentSerieIndex = series.length - 1
    const DesaturationIdealStep = 0.3
    const DesaturationMax = 1
    const desaturationAmount = DesaturationIdealStep * mostRecentSerieIndex > DesaturationMax ? DesaturationMax : DesaturationIdealStep * mostRecentSerieIndex
    const desaturationStep = series.length > 1 ? desaturationAmount / (series.length - 1) : 0
    const LuminosityIdealStep = 0.3
    const LuminosityMax = 0.6
    const luminosityAmount = LuminosityIdealStep * mostRecentSerieIndex > LuminosityMax ? LuminosityMax : LuminosityIdealStep * mostRecentSerieIndex
    const luminosityStep = series.length > 1 ? luminosityAmount / (series.length - 1) : 0
    const keysColors = this.generateColors(keys)
    const colors = {}
    for (let serieIndex = mostRecentSerieIndex; serieIndex >= 0; serieIndex--) {
      for (const key in keysColors) {
        const t = mostRecentSerieIndex - serieIndex
        colors[`${serieIndex}.${key}`] = Color(keysColors[key]).desaturate(t * desaturationStep).lighten(t * luminosityStep)
      }
    }

    // If not set, auto determine dimensions selector widget type
    if (!dimensionsSelector) {
      if (Object.keys(this.props.dimensions).length > 20) {
        dimensionsSelector = 'table'
      } else {
        dimensionsSelector = 'select'
      }
    }

    logger.log('V: render')
    
    // TODO: colors and stacks
    return <>
      <FormControl className={classes.formControl}>
        <FormLabel htmlFor="autoconfig">Pré-configuration</FormLabel>
        <Select
          value={this.state.autoConfig === null ? 'custom' : this.state.autoConfig}
          onChange={this.handleChangeAutoconfig.bind(this)}
          inputProps={{
            name: 'autoconfig',
            id: 'autoconfig',
          }}
        >
          <MenuItem disabled={true} value="custom">
            <em>Configuration personnalisée</em>
          </MenuItem>
          {Object.keys(autoConfigs).map(key => 
            <MenuItem key={key} value={key}>{autoConfigs[key].title}</MenuItem>
          )}
          
        </Select>
      </FormControl>
      
      <GraphQLDataViz 
        classes={classes}
        graphOptions={graphOptions}
        colors={colors}
        granularity={this.state.granularity}
        onGranularityChange={this.handleChangeGranularity.bind(this)}
        durationAmount={this.state.durationAmount}
        durationUnit={this.state.durationUnit}
        series={series}
        dimensions={this.props.dimensions}
        timeAggregations={timeAggregations}
        
        dates={dates}
        graphType={this.state.graphType}
        onGraphTypeChange={this.handleChangeGraphType.bind(this)}
        graphView={this.state.graphView}
        onGraphViewChange={this.handleChangeGraphView.bind(this)}
        graphStack={this.state.graphStack}
        onGraphStackChange={this.handleChangeGraphStack.bind(this)}
        dateFormatterGenerator={this.dateFormatter}
        smUpWidth={smUpWidth}
        keys={keys}
        />
      <Divider variant="middle" />
      <FormControl className={classes.formControl} style={{minWidth: '100%'}}>
        <FormLabel>Dimensions</FormLabel>
        {dimensionsSelector === 'table'
          ? <TableSelect
              multiple
              value={keys.length === 0
                ? Object.keys(this.props.dimensions).slice(0, 1)
                : keys }
              onChange={this.handleChangeKeys.bind(this)}
              dimensionsGroupsComponent={this.props.dimensionsGroupsComponent || 'auto'}
              dimensions={this.props.dimensions}
            />
          : <Select
              multiple
              value={this.state.keys}
              onChange={this.handleChangeKeys.bind(this)}
              input={<Input id="select-multiple-chip" />}
              renderValue={selected => (
                <div className={classes.chips}>
                  {selected.map(value => (
                    <Chip key={value} label={this.props.dimensions[value].title} className={classes.chip} />
                  ))}
                </div>
              )}
              MenuProps={MenuProps}
            >
              {Object.keys(this.props.dimensions).map(key => (
                <MenuItem key={key} value={key} style={getStyles(key, this.state.keys, theme)}>
                  {this.props.dimensions[key].title}
                </MenuItem>
              ))}
            </Select>
        }
        
      </FormControl>

      <Divider variant="middle" />

      <div className={classes.formControl}>
      <LocalizationProvider dateAdapter={DateFnsUtils} locale={frLocale}>
          <FormLabel>Séries temporelles</FormLabel>
          <div className={classes.datesContainer}>
            <AddDateTimeChip onClick={this.handleAddDate.bind(this)} />
            {!smUpWidth ? <br/> : null}
            {dates.map((date, i) => <DateTimeChip 
              key={i}
              date={date}
              granularity={this.state.granularity}
              formatter={this.dateFormatter(this.state.granularity === 'hour' ? 'hour' : 'day' )}
              onChange={this.handleChangeDate.bind(this, i)} 
              onDelete={this.handleDeleteDate.bind(this, i)} />)}
           
          </div>
        </LocalizationProvider>
      </div>

      <Divider variant="middle" />
      
      <FormControl className={classes.formControl} style={{marginLeft: theme.spacing(1)}}>
        <FormLabel>Durée</FormLabel>
        <Box display="flex" alignItems="end">
          <TextField
            id="duration-amount"
            value={this.state.durationAmount}
            onChange={this.handleChangeDurationAmount.bind(this)}
            type="number"
            InputLabelProps={{
              shrink: true
            }}
            classes={{root: classes.numberField}}
          />
          <MuiThemeProvider theme={darkTheme}> 
            <Select
              value={this.state.durationUnit}
              onChange={this.handleChangeDurationUnit.bind(this)}
              className={classes.selectButton}
              
            >
              {Object.keys(timeAggregations).map(taKey => 
                <MenuItem key={taKey} value={taKey}>{this.state.durationAmount > 1 ? plural(timeAggregations[taKey].value) : timeAggregations[taKey].value}</MenuItem>
              )}
            </Select>
          </MuiThemeProvider>
        </Box>
      </FormControl>
      
    </>
  }
}

const GraphQLDataViz = graphql(STATS_QUERY, {
    options: ({ granularity, durationAmount, durationUnit, series }) => ({
      variables: {
        granularity: granularity,
        duration: `${durationAmount} ${durationUnit}`,
        series: series
      }
    })
  })(DataViz)

const GraphWithStyle = withStyles(styles, { withTheme: true })(props => {
  const isWide = useMediaQuery(props.theme.breakpoints.up('sm'))
  return <Graph 
    smUpWidth={isWide} 
    {...props}
  />
})
 
const StyledGraphWithRoute = props => <Route 
    path={`${props.match.path}/:configuration?`}
    render={routeProps => <GraphWithStyle prefixPath={props.match.url} {...props} {...routeProps}/>}
  />
    
const StyledGraphWithRouteAndRouter = withRouter(StyledGraphWithRoute)

export default StyledGraphWithRouteAndRouter
