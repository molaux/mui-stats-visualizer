import React, { Component } from 'react'
import { Routes, Route } from 'react-router-dom'

import { withRouter } from './utils/router'
import { DataViz } from './DataViz'

import strtotime from 'locutus/php/datetime/strtotime'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Input from '@mui/material/Input'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Chip from '@mui/material/Chip'

import useMediaQuery from '@mui/material/useMediaQuery'

import Color from 'color'

import { LocalizationProvider } from '@mui/x-date-pickers'

import { Divider, useTheme } from '@mui/material'

import TableSelect from './TableSelect'

import HourIcon from '@mui/icons-material/AccessTime'
import DayIcon from '@mui/icons-material/ViewDay'
import WeekIcon from '@mui/icons-material/ViewWeek'
import MonthIcon from '@mui/icons-material/CalendarToday'
import YearIcon from '@mui/icons-material/ViewArray'

import DateFnsUtils from '@date-io/date-fns'
import frLocale from "date-fns/locale/fr"

import { gql } from '@apollo/client'
import { graphql } from '@apollo/client/react/hoc'

import { withStyles } from 'tss-react/mui'
import ggChartColors from './ChartColors'

import loggerGenerator from './utils/logger'
const logger = loggerGenerator('none')
const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

function getStyles(key, keys) {
  return {
    fontWeight: (theme) =>
      keys.indexOf(key) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  }
}

const styles = theme => ({
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
    justifyContent: 'right',
    alignItems: 'space-between',
    flexWrap: 'wrap',
    '& > *': {
      marginBottom: theme.spacing(2),
      marginLeft: theme.spacing(2)
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
  radioGroup: {
    margin: theme.spacing(1, 0),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5)
    }
  }
})

const STATS_QUERY = gql`
  query Statistics($granularity: String!, $movingWindowSize: Int! $duration: String!, $series: [DimensionType!]) {
    statistics(granularity: $granularity, movingWindowSize: $movingWindowSize, duration: $duration, series: $series)
  }
`

class Graph extends Component {
  constructor(props) {
    super(props);
    const { autoConfigs, defaultConfig, defaultGranularity, defaultDurationUnit, defaultDurationAmount, defaultKeys, defaultGraphType, defaultGraphStack, defaultGraphView, defaultDates, defaultMovingWindowSize } = this.props
    this.state = {
      showEvents: true,
      movingWindowSize: defaultMovingWindowSize || (autoConfigs[defaultConfig]?.movingWindowSize ? autoConfigs[defaultConfig].movingWindowSize : 1),
      granularity: defaultGranularity || (autoConfigs[defaultConfig]?.granularity ? autoConfigs[defaultConfig].granularity : 'day'),
      graphType: defaultGraphType || 'line',
      graphView: defaultGraphView || 'value',
      graphStack: defaultGraphStack !== undefined && defaultGraphStack !== null ? defaultGraphStack : false,
      keys: defaultKeys || [],
      dimensions: {},
      autoConfig: defaultConfig,
      durationUnit: !defaultConfig && defaultDurationUnit ? defaultDurationUnit : autoConfigs[defaultConfig]?.durationUnit,
      durationAmount: !defaultConfig && defaultDurationAmount ? defaultDurationAmount :  autoConfigs[defaultConfig]?.durationAmount,
      dates: !defaultConfig && defaultDates ? defaultDates : autoConfigs[defaultConfig]?.dates() || []
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

  onShowEvents (event) {
    this.setState({ showEvents: event.target.checked })
  }

  dateFormatter(granularity) {
    switch (granularity) {
      case 'hour': return 'EEE dd/MM/yyyy, HH:00'
      case 'date': return 'dd/MM/yyyy'
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

  handleChangeMovingWindowSize(value) {
    if (value !== '' && !isNaN(parseInt(value, 10))) {
      this.setState({
        autoConfig: null,
        movingWindowSize: parseInt(value, 10)
      })
      if (typeof this.props.onMovingWindowSizeChange === 'function') {
        this.props.onMovingWindowSizeChange(parseInt(value, 10))
      }
      if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
        this.props.onAutoconfigChange('custom')
      }
    }
  }

  handleChangeDurationAmount (value) {
    if (value !== '' && !isNaN(parseInt(value, 10))) {
      this.setState({
        autoConfig: null,
        durationAmount: value
      })
      if (typeof this.props.onDurationAmountChange === 'function') {
        this.props.onDurationAmountChange(parseInt(value, 10))
      }
      if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
        this.props.onAutoconfigChange('custom')
      }
    }
  }
  
  handleChangeDurationUnit (value) {
    this.setState({
      autoConfig: null,
      durationUnit: value
    })
    if (typeof this.props.onDurationUnitChange === 'function') {
      this.props.onDurationUnitChange(value)
    }
    if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
      this.props.onAutoconfigChange('custom')
    }
  }

  handleChangeAutoconfig (event) {
    const { autoConfigs } = this.props
    this.setState({
      granularity:  autoConfigs[event.target.value].granularity,
      durationUnit: autoConfigs[event.target.value].durationUnit,
      durationAmount: autoConfigs[event.target.value].durationAmount,
      movingWindowSize: autoConfigs[event.target.value].movingWindowSize,
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
      if (typeof this.props.onDatesChange === 'function') {
        this.props.onDatesChange(datesCopy)
      }
      return { 
        dates: datesCopy,
        autoConfig: null
      }
    })
    if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
      this.props.onAutoconfigChange('custom')
    }
  }

  handleAddDate() {
    this.setState(({dates, durationAmount, durationUnit}) => {
      let datesCopy = Array.from(dates)
      datesCopy.unshift(new Date(strtotime(`-${durationAmount} ${durationUnit}`, (dates[0] || new Date()).getTime() / 1000) * 1000))
      if (typeof this.props.onDatesChange === 'function') {
        this.props.onDatesChange(datesCopy)
      }
      return {
        autoConfig: null,
        dates: datesCopy
      }
    })
    if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
      this.props.onAutoconfigChange('custom')
    }
  }

  handleDeleteDate(j) {
    this.setState(state => {
      const remainingDates = state.dates.length > 1 
        ? state.dates.filter((_, i) => i !== j)
        : [ new Date(strtotime(`-${state.durationAmount} ${state.durationUnit}`) * 1000) ]

      if (typeof this.props.onDatesChange === 'function') {
        this.props.onDatesChange(remainingDates)
      }

      return {
        autoConfig: null,
        dates: remainingDates
      }
    })

    if (typeof this.props.onAutoconfigChange === 'function' && this.state.autoConfig !== null) {
      this.props.onAutoconfigChange('custom')
    }
  }

  encodeState() {
    return encodeURIComponent(JSON.stringify(this.state).replaceAll('%', '_percent_'))
  }

  decodeState(coded) {
    return JSON.parse(decodeURIComponent(coded).replaceAll('_percent_', '%'))
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    logger.log('V: did update')
    if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
      logger.log('V: pushing new url', `${this.encodeState()}`)
      this.props.history.push(`${this.encodeState()}`)
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
      || nextProps.smUpWidth !== this.props.smUpWidth
      || nextProps.events !== this.props.events
      || nextProps.showEvents !== this.props.showEvents

  }

  static getDerivedStateFromProps(props, state) {
    logger.log('V: gdsfp - ', state.keys.length === 0)
    return {
        ...state,
        // keys: Object.keys(props.dimensions).slice(0, 1),
        keys: (state.keys.length === 0 ? Object.keys(props.dimensions).slice(0, 1) : state.keys).filter((k) => k !== null),
      }
  }

  componentDidMount () {
    logger.log('V: did mount', this.props.match)
    let urlConfiguration = {}
    if (this.props.match && this.props.match.params.configuration && this.props.match.params.configuration !== this.props.match.params.module) {
      logger.log('V: did mount with config')

      urlConfiguration = this.decodeState(this.props.match.params.configuration)
      if (Array.isArray(urlConfiguration.dates)) {
        urlConfiguration.dates = urlConfiguration.dates.map(strDate => new Date(strDate))
      }
      this.setState(state => ({
        ...state,
        ...urlConfiguration
      }))
    } else {
      logger.log('V: pushing new url', `${this.encodeState()}`)
      this.props.history.push(`${this.encodeState()}`)
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
    let {
      classes,
      graphOptions,
      dimensionsSelector,
      autoConfigs,
      timeAggregations,
      smUpWidth,
      EventsManager,
      events
    } = this.props

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
    return <LocalizationProvider dateAdapter={DateFnsUtils} locale={frLocale}>
      <FormControl variant="standard" className={classes.formControl}>
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
        movingWindowSize={this.state.movingWindowSize}
        onMovingWindowSizeChange={this.handleChangeMovingWindowSize.bind(this)}
        durationAmount={this.state.durationAmount}
        onDurationAmountChange={this.handleChangeDurationAmount.bind(this)}
        durationUnit={this.state.durationUnit}
        onDurationUnitChange={this.handleChangeDurationUnit.bind(this)}
        series={series}
        dimensions={this.props.dimensions}
        timeAggregations={timeAggregations}
        dates={dates}
        onDateAdd={this.handleAddDate.bind(this)}
        onDateDelete={this.handleDeleteDate.bind(this)}
        onDateChange={this.handleChangeDate.bind(this)}
        graphType={this.state.graphType}
        onGraphTypeChange={this.handleChangeGraphType.bind(this)}
        graphView={this.state.graphView}
        onGraphViewChange={this.handleChangeGraphView.bind(this)}
        graphStack={this.state.graphStack}
        onGraphStackChange={this.handleChangeGraphStack.bind(this)}
        dateFormatterGenerator={this.dateFormatter}
        smUpWidth={smUpWidth}
        keys={keys}
        events={events}
        showEvents={this.state.showEvents}
        />
      { EventsManager ? <EventsManager showEvents={this.state.showEvents} onShowEvents={this.onShowEvents.bind(this)}/> : null }
      <Divider variant="middle" sx={{marginBottom: (theme) => theme.spacing(1)}}/>
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
                  {selected.slice(0,5).map(value => (
                    <Chip key={value} label={this.props.dimensions[value].title} className={classes.chip} />
                  ))}
                  {selected.length > 5 ? <Chip label={'...'} className={classes.chip} /> : null}
                </div>
              )}
              MenuProps={MenuProps}
            >
              {Object.keys(this.props.dimensions).map(key => (
                <MenuItem key={key} value={key} sx={getStyles(key, this.state.keys)}>
                  {this.props.dimensions[key].title}
                </MenuItem>
              ))}
            </Select>
        }
      </FormControl>
    </LocalizationProvider>
  }
}

const GraphQLDataViz = graphql(STATS_QUERY, {
    options: ({ granularity, movingWindowSize, durationAmount, durationUnit, series }) => ({
      variables: {
        granularity,
        duration: `${durationAmount} ${durationUnit}`,
        movingWindowSize,
        series
      }
    })
  })(DataViz)

const GraphWithStyleAndRoute = withRouter(withStyles(props => {
  const theme = useTheme()
  const isWide = useMediaQuery(theme.breakpoints.up('sm'))
  return <Graph 
    smUpWidth={isWide} 
    {...props}
  />
}, styles))
 
const StyledGraphWithRouteAndRouter = props => <Routes>
    <Route 
      path={':configuration/*'}
      element={<GraphWithStyleAndRoute {...props}/>}
    />
  </Routes>
    
export default StyledGraphWithRouteAndRouter
