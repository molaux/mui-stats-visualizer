import React, { Component } from 'react'
import { Query } from 'react-apollo'

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'

import strtotime from 'locutus/php/datetime/strtotime'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import Radio from '@material-ui/core/Radio'
import Checkbox from '@material-ui/core/Checkbox'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import InputLabel from '@material-ui/core/InputLabel'
import Input from '@material-ui/core/Input'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Chip from '@material-ui/core/Chip'
import Box from '@material-ui/core/Box'
import DateIcon from '@material-ui/icons/Timeline'
import {
  MuiPickersUtilsProvider,
  DateTimePicker,
  DatePicker } from '@material-ui/pickers'
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import AccessTime from '@material-ui/icons/AccessTime'
import DateRange from '@material-ui/icons/DateRange'
import Fab from '@material-ui/core/Fab'
import AddIcon from '@material-ui/icons/Add'
import Divider from '@material-ui/core/Divider'

import Table from './TableResponsive'
import TableSelect from './TableSelect'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'

import DateFnsUtils from '@date-io/date-fns'
import frLocale from "date-fns/locale/fr"

import gql from 'graphql-tag'
import { withStyles } from '@material-ui/core/styles'
import { format, startOfDay, startOfMonth } from 'date-fns'
import ggChartColors from './ChartColors'
import deepmerge from 'deepmerge'
import plural from 'pluralize-fr'

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

function getStyles(key, keys, theme) {
  return {
    fontWeight:
      keys.indexOf(key) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  }
}

const styles = theme => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  graph: {
    position: 'relative',
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(5),
    boxSizing: 'border-box',
  },
  pie: {
    fontSize: 10
  },
  tooltip: {
    fontSize: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    boxShadow: '5px 5px 1em rgba(0,0,0,0.3)',
    padding: theme.spacing(1),
    '& p': {
      margin: theme.spacing(0.5)
    },
    '& > div:not(:first-child)': {
      marginTop: theme.spacing(1)
    }
  },
  formControl: {
    padding: theme.spacing(3),
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  radioGroup: {
    margin: theme.spacing(1, 0),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  fatChip: {
    height: 'auto',
    padding: theme.spacing(1, 0)
  },
  table: {
    marginBottom: theme.spacing(4),
  },
  paddedContent: {
    position: 'relative',
    boxSizing: 'border-box',
    minWidth: '100%',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3)
  }
})

const statsQuery = () => gql`
  query Statistics($granularity: String!, $duration: String!, $series: [DimensionType!]) {
    statistics(granularity: $granularity, duration: $duration, series: $series)
  }
`

/**
 * Given an object and an array properties, resolves o[array[0]][array[1]][...]
 * array properties must be referenced as 'prop[i]' in keyChain
 * @param {object} o the object to dereference
 * @param {array} keyChain The properties chain
 * @return {object} The resolved object 
 */
const resolveObjectKeyChain = (o, keyChain) => keyChain
  .reduce((ro, property) => {
    if (property.slice(-1) === ']') {
      const openTokenIndex = property.indexOf('[')
      const arrayName = property.substring(0, openTokenIndex)
      const index =  property.substring(openTokenIndex + 1, property.length - 1)
      return ro[arrayName][index]
    } else {
      return ro[property]
    }
  }, o)

const DateTimeChip = ({ formatter, granularity, classes, onDelete, onChange, date }) => <Chip
    icon={<DateIcon />}
    classes={{root: classes.fatChip}}
    label={granularity === 'hour'
      ? <DateTimePicker
        label="Début de la série"
        value={date}
        disableFuture
        autoOk
        labelFunc={value => value ? format(value, formatter, { locale: frLocale }) : ''}
        ampm={false}
        onAccept={onChange}
        onChange={() => null}
        leftArrowIcon={<KeyboardArrowLeft />}
        rightArrowIcon={<KeyboardArrowRight />}
        dateRangeIcon={<DateRange />}
        timeIcon={<AccessTime />}
        />
      : <DatePicker
        label="Début de la série"
        value={date}
        disableFuture
        autoOk
        labelFunc={value => value ? format(value, formatter, { locale: frLocale }) : ''}
        onAccept={onChange}
        onChange={() => null}
        leftArrowIcon={<KeyboardArrowLeft />}
        rightArrowIcon={<KeyboardArrowRight />}
        />}
    onDelete={onDelete}
    className={classes.chip}
    variant="outlined"
    color="primary"
  />

const formatSerieValue = (dimension, value) => {
  if (value === null) {
    return ''
  }
  switch (dimension.type) {
    case 'currency':
      return value.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})
    case 'percent':
      return value.toLocaleString('fr-FR', {style: 'percent'})
    case 'integer':
      return Math.round(value)
    default:
      return value.toLocaleString('fr-FR', {style: 'decimal'})
  }
}

const formatShareValue = (value) => {
  if (value < 1/8) {
    return `⚪ ${value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`
  } else if (value < 3/8) {
    return `◔ ${value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`
  } else if (value < 5/8) {
    return `◑ ${value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`
  } else if (value < 7/8) {
    return `◕ ${value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`
  } else {
    return `⚫ ${value.toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`
  }
}

const Share = ({value}) => <Box component="span" style={{
    whiteSpace: 'nowrap'
  }}>{formatShareValue(value)}</Box>

const formatVariationValue = value => `${value > 0 ? '⬈' : '⬊'} ${Math.abs(value).toLocaleString('fr-FR', {style: 'percent', minimumFractionDigits: 1})}`

const Variation = ({value}) => <Box component="span" style={{
    whiteSpace: 'nowrap',
    color: value !== null
      ? value > 0
        ? 'green'
        : value< 0
          ? 'red'
          : 'inherit'
      : 'inherit'
  }}>{formatVariationValue(value)}</Box>

const CustomTooltip = (dimensions, summize) => ({ active, payload, label, clasName, wrapperStyle, ...rest }) => {
  let groupsByLabel = (payload || []).reduce((groups, point) => {
    const dimensionKey = point.dataKey.split('.')[0]
    const date = resolveObjectKeyChain(point.payload, [ dimensionKey ]).date
    if (groups[date] === undefined) {
      groups[date] = {
        points: [ {
          ...point,
          variation: Object.keys(groups).length > 0
            ? point.value / groups[Object.keys(groups)[Object.keys(groups).length - 1]].points[0].value
            : null,
          share: null
        } ],
        total: point.value,
        variation: Object.keys(groups).length > 0
          ? point.value / groups[Object.keys(groups)[Object.keys(groups).length - 1]].total
          : null
      }
    } else {
      groups[date].points.push({
        ...point,
        variation: Object.keys(groups).length > 1
          ? point.value / groups[Object.keys(groups)[Object.keys(groups).length - 2]].points[groups[date].points.length].value
          : null,
        share: null
      })
      groups[date].total += point.value
      groups[date].variation =  Object.keys(groups).length > 1
        ? groups[date].total / groups[Object.keys(groups)[Object.keys(groups).length - 2]].total
        : null
      if (summize) {
        for (const point of groups[date].points) {
          point.share = point.value / groups[date].total
        }
      }
    }
    return groups
  }, {})

  if (active) {
    return <div className={clasName} style={wrapperStyle}>
        {Object.keys(groupsByLabel).map(date => 
          (
            <div key={date}>
              <Typography variant="subtitle2" component="p">
                {date}
                {summize
                  ? ` : ${formatSerieValue(dimensions[groupsByLabel[date].points[0].dataKey.split('.').slice(1).join('.')], groupsByLabel[date].total)}`
                  : '' }
                {summize && groupsByLabel[date].variation !== null 
                  ? <><span> (</span><Variation value={groupsByLabel[date].variation - 1} /><span>)</span></>
                  : null}
              </Typography>
              {groupsByLabel[date].points.map(point => {
                const serieKey = point.dataKey.split('.').slice(1).join('.')
                return <p
                    key={point.dataKey}
                    style={{color: point.stroke ? point.stroke : point.fill}}>
                    {dimensions[serieKey].title} : {formatSerieValue(dimensions[serieKey], point.value)}
                    {point.variation !== null || point.share !== null
                      ? <><span> (</span>{
                        point.share !== null ? <Share value={point.share} /> : null
                      }{
                        point.variation !== null && point.share !== null ? ' ╱ ' : null 
                      }{
                        point.variation !== null ? <Variation value={point.variation - 1} /> : null 
                      }<span>)</span></>
                      : null
                    }
                  </p>
                })
              }
            </div>
          ))}
      </div>
  }

  return null
}

class Graph extends Component {
  constructor(props) {
    super(props);
    const { autoConfigs, defaultConfig } = this.props
    this.state = { 
      granularity: autoConfigs[defaultConfig].granularity ? autoConfigs[defaultConfig].granularity : 'day',
      timeStr: '',
      testDate: null,
      graphType: 'line',
      graphStack: false,
      keys: [],
      autoConfig: defaultConfig,
      durationUnit: autoConfigs[defaultConfig].durationUnit,
      durationAmount: autoConfigs[defaultConfig].durationAmount,
      dates: autoConfigs[defaultConfig].dates()
    }
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

  handleChangeGraphType(event) {
    this.setState({ graphType: event.target.value })
  }

  handleChangeGraphStack(event) {
    this.setState({ graphStack: event.target.checked })
  }

  handleChangeGranularity(event) {
    this.setState({ granularity: event.target.value })
  }

  handleChangeDurationAmount (event) {
    if (event.target.value !== '' && !isNaN(parseInt(event.target.value, 10))) {
      this.setState({
        autoConfig: null,
        durationAmount: event.target.value
      })
    }    
  }
  
  handleChangeDurationUnit (event) {
    this.setState({
      autoConfig: null,
      durationUnit: event.target.value
    })
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
      dates.unshift(new Date(strtotime(`-${durationAmount} ${durationUnit}`, dates[0].getTime() / 1000) * 1000))
      return {
        autoConfig: null,
        dates
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

  static getDerivedStateFromProps(props, state) {
    if (state.keys.length === 0) {
      return {
        ...state,
        keys: Object.keys(props.dimensions).slice(0, 1)
      }
    } else {
      return null
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
    let { classes, graphOptions, theme, dimensionsSelector, autoConfigs, timeAggregations } = this.props
    
    if ( !graphOptions ) {
      graphOptions = { serieType: 'linear' }
    }

    if ( !timeAggregations ) {
      timeAggregations = {
        hour: 'Heure',
        day: 'Jour',
        week: 'Semaine',
        month: 'Mois',
        year: 'An'
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
      ?  this.props.dimensions[key].series
      : key)
      .flat())]

    // Create series from start dates / dimensions
    const series = dates.map(date => ({
        from: date.toISOString(),
        dimensions: expandedKeys
      }))
    
    // Generate colors
    const colors = this.generateColors(series.map((v, i) => keys.map(key => `${i}.${key}`)).flat())

    // Get date format according to granularity
    const dateFormatter = this.dateFormatter(this.state.granularity)

    // Select chart type
    let [ Chart, SerieComponent ] = this.state.graphType === 'bar' 
      ? [ BarChart, Bar ]
      : !this.state.graphStack
        ? [ LineChart, Line ]
        : [ AreaChart, Area ]
    
    // If not set, auto determine dimensions selector widget type
    if (!dimensionsSelector) {
      if (Object.keys(this.props.dimensions).length > 20) {
        dimensionsSelector = 'table'
      } else {
        dimensionsSelector = 'select'
      }
    }
    
    // TODO: colors and stacks
    return <>
      <Query
        // Request stats data 
        query={statsQuery()}
        variables={{
          granularity: this.state.granularity,
          duration: `${this.state.durationAmount} ${this.state.durationUnit}`,
          series
        }}
      >
      {({ loading, error, data }) => {
        let series = []
        let reduction = []
        let dimensionsTypesAreHomogenes = true
        if (!loading) {
          const computedKeys = keys.filter(key => this.props.dimensions[key].series !== undefined)

          // Format series and compute virtual dimentions in order to be injected in reCharts
          series = data.statistics.map(point => ({
            ...point,
            date: format(new Date(point.date), dateFormatter, { weekStartsOn: 1, locale: frLocale }),
            dimensions: point.dimensions.map(dimension => ({
                ...deepmerge(dimension, computedKeys
                  .reduce((extraFields, computedKey) => 
                    deepmerge(extraFields,
                      computedKey
                        .split('.')
                        .reverse()
                        .reduce(
                          (o, k) => ({ [k]: o }),
                          this.props.dimensions[computedKey].f(dimension))
                      ),
                    {})),
                date: format(new Date(dimension.date), dateFormatter, { weekStartsOn: 1, locale: frLocale })
              })
            )
          }))

          // compute reductions and variations between series 
          reduction = series[0].dimensions.map((dimension, i) => {
            const dimensionSerie = series.map(point => point.dimensions[i])
            return keys.reduce((o, key) => {
              o[key] = dimensionSerie
                .map(entry => resolveObjectKeyChain(entry, key.split('.')))
                .reduce(this.props.dimensions[key].reducer, null)
              o[key] = o[key] !== null && typeof o[key] === 'object'
                ? o[key].value
                : o[key]
              return o
            }, {})
          })

          dimensionsTypesAreHomogenes = Object.keys(reduction[0]).reduce((type, key) =>
            type === this.props.dimensions[key].type
              ? type
              : null, this.props.dimensions[Object.keys(reduction[0])[0]].type)
          
        }
        return <div className={classes.graph}>
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
            <div className={classes.paddedContent}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Série
                  </TableCell>
                  {reduction.length 
                    ? Object.keys(reduction[0]).map((key, i) =>
                      <TableCell key={key}>
                        {this.props.dimensions[key].title}
                      </TableCell>)
                    : null}
                </TableRow>
              </TableHead>
              <TableBody>
              {reduction.reduce(
                (lastSeries, serie) => [
                  ...lastSeries, {
                  dimensions: serie,
                  total: Object.keys(serie).reduce((total, key) => total + serie[key], 0),
                  totalVariation: ! lastSeries.length 
                    ? null
                    : Object.keys(serie).reduce((total, key) => total + serie[key], 0) / lastSeries[lastSeries.length -1].total,
                  variation: Object.keys(serie).reduce(
                    (o, key) => {
                      if (! lastSeries.length) {
                        o[key] = null
                      } else {
                        o[key] = lastSeries[lastSeries.length -1].dimensions[key] 
                          ? serie[key] / lastSeries[lastSeries.length -1].dimensions[key]
                          : null
                      }
                      return o
                    },
                    {}
                  ) }
                ],
                []
              ).map(({dimensions, variation, total, totalVariation}, i) =>
                <TableRow key={i}>
                  <TableCell>
                    <Typography variant="h6" gutterBottom= {this.state.graphStack && dimensionsTypesAreHomogenes}>
                    {format(this.state.dates[i], this.dateFormatter(this.state.granularity === 'hour' ? 'hour' : 'day' ), { locale: frLocale })}, {this.state.durationAmount} {(this.state.durationAmount > 1 ? plural(timeAggregations[this.state.durationUnit]) : timeAggregations[this.state.durationUnit]).toLowerCase()}
                    </Typography>
                    {/* Check if graph is stacked and dimensions have same type */}
                    {this.state.graphStack && dimensionsTypesAreHomogenes
                            ? <Box style={{
                              whiteSpace: 'nowrap',
                              color: totalVariation !== null
                                ? totalVariation - 1 > 0
                                  ? 'green'
                                  : totalVariation - 1 < 0
                                    ? 'red'
                                    : 'inherit'
                                : 'inherit'
                              }}>
                              {formatSerieValue(this.props.dimensions[Object.keys(dimensions)[0]], total)}
                              {totalVariation !== null 
                                ? ` (${formatVariationValue(totalVariation - 1)})`
                                : null}
                            </Box>
                            : null }
                  </TableCell>
                  {Object.keys(dimensions).map(key => 
                    <TableCell 
                      key={`${i}-${key}`} 
                      style={{
                        whiteSpace: 'nowrap',
                        color: variation[key] !== null
                          ? variation[key] - 1 > 0
                            ? 'green'
                            : variation[key] - 1 < 0
                              ? 'red'
                              : 'inherit'
                          : 'inherit'
                        }}
                      >
                      <span style={{
                          display:'inline-block', 
                          width:'1em',
                          height: '1em',
                          marginRight: '0.3em',
                          marginBottom: '-0.15em',
                          backgroundColor: colors[`${i}.${key}`]
                        }}></span>
                      {formatSerieValue(this.props.dimensions[key], dimensions[key])}
                      {variation[key] !== null || (this.state.graphStack && dimensionsTypesAreHomogenes)
                        ? ` (${this.state.graphStack && dimensionsTypesAreHomogenes
                          ? formatShareValue(dimensions[key] / total)
                          : ''}${variation[key] !== null
                          ? `${this.state.graphStack && dimensionsTypesAreHomogenes ? ' ╱ ': ''}${formatVariationValue(variation[key] - 1)}`
                          : ''})`
                        : null}
                    </TableCell>
                  )}
                </TableRow>
              )}
              </TableBody>
            </Table>
            </div>
            <div className={classes.paddedContent} >
              <div style={{
                paddingBottom: '30%', /* width/height Ratio */
                position: 'relative',
                height: 0
              }} >
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%'
                }}>
                  <ResponsiveContainer>
                    <Chart
                        data={series}
                        margin={{
                          top: 0,
                          right: 0,
                          left: 20,
                          bottom: ['hour', 'day', 'week'].includes(this.state.granularity)
                            ? 90
                            : 50 }}
                      >
                      <YAxis />
                      <XAxis
                        dataKey={`date`}
                        key={`date`}
                        angle={-30}
                        textAnchor="end" 
                        />
                      <Tooltip
                        clasName={classes.tooltip}
                        wrapperStyle={{ fontSize: 10 }}
                        content={CustomTooltip(this.props.dimensions, this.state.graphStack)}
                        />
                      <CartesianGrid stroke="#f5f5f5" />

                      {series.length 
                          ? series[0].dimensions.map((v, i) =>
                          keys.map(key =>
                            <SerieComponent
                              key={`dimensions[${i}].`+key}
                              dataKey={`dimensions[${i}].`+key}
                              stackId={this.state.graphStack?i:`dimensions[${i}].`+key}
                              style={{position: 'relative'}}
                              type={graphOptions.serieType}
                              dot={false}
                              {...(SerieComponent===Line || SerieComponent===Area
                                ? { 
                                  stroke: colors[`${i}.${key}`],
                                  fill: colors[`${i}.${key}`],
                                  strokeWidth: 3
                                }
                                : { 
                                  fill: colors[`${i}.${key}`] 
                                })
                              }
                              >
                            </SerieComponent>
                          )
                        )
                      : null}
                    </Chart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      }}
      </Query>

      <Divider variant="middle" />

      <FormControl className={classes.formControl} style={{minWidth: '100%'}}>
        <FormLabel>Dimensions</FormLabel>
        {dimensionsSelector === 'table'
          ? <TableSelect
              multiple
              initialValue={Object.keys(this.props.dimensions).slice(0, 1)}
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
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={frLocale}>
          <FormLabel>Séries temporelles</FormLabel>
          <div className={classes.datesContainer}>
            {dates.map((date, i) => <DateTimeChip 
              key={i}
              date={date}
              granularity={this.state.granularity}
              formatter={this.dateFormatter(this.state.granularity === 'hour' ? 'hour' : 'day' )}
              classes={classes} 
              onChange={this.handleChangeDate.bind(this, i)} 
              onDelete={this.handleDeleteDate.bind(this, i)} />)}
            <Fab color="primary" aria-label="Add" className={classes.fab} onClick={this.handleAddDate.bind(this)}>
              <AddIcon />
            </Fab>
          </div>
        </MuiPickersUtilsProvider>
      </div>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Agrégation</FormLabel>
        <Select
          value={this.state.granularity}
          onChange={this.handleChangeGranularity.bind(this)}
          inputProps={{
            name: 'agregation',
          }}
        >
          {Object.keys(timeAggregations).map(taKey => 
            <MenuItem key={taKey} value={taKey}>Par {timeAggregations[taKey].toLowerCase()}</MenuItem>
          )}
        </Select>
      </FormControl>
      
      <FormControl className={classes.formControl}>
        <FormLabel>Durée</FormLabel>
        <TextField
          id="duration-amount"
          value={this.state.durationAmount}
          onChange={this.handleChangeDurationAmount.bind(this)}
          type="number"
          InputLabelProps={{
            shrink: true,
            name: 'duration-amount'
          }}
          margin="normal"
        />
        <Select
          value={this.state.durationUnit}
          onChange={this.handleChangeDurationUnit.bind(this)}
          inputProps={{
            name: 'duration-unit',
          }}
        >
          {Object.keys(timeAggregations).map(taKey => 
            <MenuItem key={taKey} value={taKey}>{this.state.durationAmount > 1 ? plural(timeAggregations[taKey]) : timeAggregations[taKey]}</MenuItem>
          )}
        </Select>
      </FormControl>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Type de représentation</FormLabel>
        <RadioGroup
          aria-label="Type de graphe"
          className={classes.radioGroup}
          value={this.state.graphType}
          onChange={this.handleChangeGraphType.bind(this)}
        >
          <FormControlLabel value="line" control={<Radio />} label="Lignes" />
          <FormControlLabel value="bar" control={<Radio />} label="Colonnes" />
        </RadioGroup>
      </FormControl>

      <Divider variant="middle" />

      <FormControl className={classes.formControl}>
        <FormLabel>Empilement</FormLabel>
        <FormControlLabel  control={<Checkbox onChange={this.handleChangeGraphStack.bind(this)} checked={this.state.graphStack} />} label="Empiler" />
      </FormControl>
      
    </>
  }
}
 
export default withStyles(styles, { withTheme: true })(Graph)
