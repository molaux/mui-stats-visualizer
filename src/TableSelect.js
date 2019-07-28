import React, { PureComponent } from 'react'
import Table from './TableResponsive'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableRow from '@material-ui/core/TableRow'
import TableHead from '@material-ui/core/TableHead'
import { withStyles } from '@material-ui/core/styles'
import Checkbox from '@material-ui/core/Checkbox'
import TextField from '@material-ui/core/TextField'
import TablePagination from '@material-ui/core/TablePagination'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'
import shouldUpdate from 'recompose/shouldUpdate'

const checkPropsChange = (props, nextProps) => true ||
  props.subDimensions.reduce((shouldUpdate, subDim) => shouldUpdate || 
    ((nextProps.value.indexOf(nextProps.group.dimensions[subDim].key) !== -1) !== (props.value.indexOf(props.group.dimensions[subDim].key) !== -1)), false)

const RowGroup = shouldUpdate(checkPropsChange)(({ group, subDimensions, onChange, value }) => <TableRow>
    <TableCell style={{ fontWeight: group.depth === 1 ? 'bold' : 'normal' }}>
      {group.label}
    </TableCell>
    {subDimensions.map(subDim => <TableCell key={subDim}>
      <Checkbox
        onChange={event => onChange(group.dimensions[subDim].key, event)}
        value={group.dimensions[subDim].key}
        checked={value.indexOf(group.dimensions[subDim].key) !== -1} />
    </TableCell>
    )}
  </TableRow>)

class TableSelect extends PureComponent {
  state = {
    dimensions: {},
    value: [],
    currentPage: 0,
    perPage: 10,
    filter: '',
    depthFilter: '',
    groups: {},
    filteredGroups: []
  }

  handleChange(key, event) {
    const value = event.target.checked 
    ? [ ...this.state.value, key ]
    : this.state.value.filter(v => v!== key)
    this.setState({ value })
    this.props.onChange(value)
  }

  handleFilterChange(event) {
    this.setState({
      filter: event.target.value,
      currentPage: 0
    })
    this.applyFilters()
  }

  handleChangeDepthFilter(event) {
    this.setState({
      depthFilter: event.target.value,
      currentPage: 0
    })
    this.applyFilters()
  }

  handleChangePage(event, page) {
    this.setState({
      currentPage: page
    })
  }

  static getDerivedStateFromProps(props, state) {
    if (Object.keys(props.dimensions).length !== Object.keys(state.dimensions).length) {
      const groups =  Object.keys(props.dimensions).reduce((groups, dimensionKey) => {
        if (! (props.dimensions[dimensionKey].group.key in groups)) {
          groups[props.dimensions[dimensionKey].group.key] = {
            label: props.dimensions[dimensionKey].group.label,
            depth: props.dimensions[dimensionKey].group.depth,
            dimensions: {}
          }
        }
        groups[props.dimensions[dimensionKey].group.key].dimensions[props.dimensions[dimensionKey].group.dimension] = {
          key: dimensionKey,
          dimension: props.dimensions[dimensionKey]
        }
        return groups
      }, {})

      return {
        dimensions: props.dimensions,
        groups,
        filteredGroups: Object.keys(groups),
        subDimensions: Object.keys(Object.values(groups)[0].dimensions),
        value: props.initialValue
      }
    }

    // Return null if the state hasn't changed
    return null;
  }

  getSubDimKeys(subDim) {
    return this.state.filteredGroups.map(groupKey => this.state.groups[groupKey].dimensions[subDim].key)
  }

  isAllIncluded(value, keys) {
    return keys.reduce((allIncluded, k) => allIncluded && value.indexOf(k) !== -1, true)
  }

  mergeValues(value, newValues) {
    return newValues.reduce((vals, nv) => {
      if(vals.indexOf(nv) === -1) {
        vals.push(nv)
      }
      return vals
    }, value)
  }

  onChangeSelectSubDim(subDim, event) {
    const keys = this.getSubDimKeys(subDim)
    const value = event.target.checked 
    ? this.mergeValues(this.state.value, keys)
    : this.state.value.filter(v => keys.indexOf(v) === -1)
    this.setState({ value })
    this.props.onChange(value)
  }

  applyFilters() {
    this.setState(state => {
      const filterRegex = RegExp(state.filter, 'gi')
      return { 
        filteredGroups: Object.keys(state.groups).filter(groupKey => 
          filterRegex.test(state.groups[groupKey].label) &&
          (state.depthFilter === "" || state.groups[groupKey].depth === state.depthFilter))
      }
    })
  }

  render () {
    const { classes } = this.props
    const { groups, subDimensions, value, filteredGroups, perPage, currentPage, depthFilter } = this.state
   
    const slicedGroups = filteredGroups
      .slice(currentPage * perPage, (currentPage + 1) * perPage)
      .reduce((gps, key) => ({ ...gps, [key]: groups[key] }), {}) 

    return <>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>
              <TextField
                id="standard-search"
                label="Filtre"
                type="search"
                onChange={this.handleFilterChange.bind(this)}
                className={classes.textField}
                margin="normal"
              />
            </TableCell>
            <TableCell colSpan={2}>
              <FormControl margin="normal">
                <InputLabel 
                  style={{whiteSpace: 'nowrap'}}
                  shrink htmlFor="age-simple">Niveau des catégories</InputLabel>
                <Select
                  value={depthFilter}
                  onChange={this.handleChangeDepthFilter.bind(this)}
                  displayEmpty
                  inputProps={{
                    name: 'Type'
                  }}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value={1}>Catégories</MenuItem>
                  <MenuItem value={2}>Sous-catégories</MenuItem>
                </Select>
              </FormControl>
            </TableCell>
            <TablePagination
              count={Object.keys(filteredGroups).length}
              onChangePage={this.handleChangePage.bind(this)}
              page={currentPage}
              rowsPerPage={perPage}
              />
          </TableRow>
          <TableRow>
            <TableCell>
              Série
            </TableCell>
            {subDimensions.map(dimension => <TableCell key={dimension}>
              <Checkbox
                onChange={this.onChangeSelectSubDim.bind(this, dimension)}
                checked={this.isAllIncluded(value, this.getSubDimKeys(dimension))} />
              {dimension}
            </TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(slicedGroups).map(groupKey =>
            <RowGroup
              key={groupKey}
              group={groups[groupKey]}
              subDimensions={subDimensions}
              onChange={this.handleChange.bind(this)}
              value={value}
              />)}
        </TableBody>
      </Table>
    </>
  }
}

export default withStyles(theme => {

}, { withTheme: true })(TableSelect)