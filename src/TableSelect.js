import React, { PureComponent } from 'react'
import Table from './TableResponsive'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import { withStyles } from '@mui/styles'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import ListItemText from '@mui/material/ListItemText'
import Select from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'

import loggerGenerator from './utils/logger'

const logger = loggerGenerator('none')

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      // maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
}

const checkPropsChange = (props, nextProps) => props.dimensionsGroupsComponent === nextProps.dimensionsGroupsComponent &&
  !props.subDimensions.reduce((shouldUpdate, subDim) => 
    shouldUpdate || 
      ((nextProps.value.indexOf(nextProps.group.dimensions[subDim].key) !== -1) !== (props.value.indexOf(props.group.dimensions[subDim].key) !== -1)),
    false)

const RowGroup = React.memo(({ 
  classes, 
  group, 
  subDimensions, 
  onChange, 
  value,
  dimensionsGroupsComponent }) => <TableRow>
    <TableCell
      style={{ fontWeight: group.depth === 1 ? 'bold' : 'normal' }}
      colSpan={dimensionsGroupsComponent === 'expanded' ? 1 : 2 }
      >
      {group.label}
    </TableCell>
    {dimensionsGroupsComponent === 'expanded'
      ? subDimensions.map(subDim => <TableCell key={group.dimensions[subDim].key}>
        <Checkbox
          onChange={event => onChange(group.dimensions[subDim].key, event)}
          value={group.dimensions[subDim].key}
          checked={value.indexOf(group.dimensions[subDim].key) !== -1} />
      </TableCell>
      )
      : <TableCell  colSpan={50}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="select-multiple-checkbox">Dimensions</InputLabel>
          <Select
            multiple
            autoWidth={true}
            value={value.filter(key => Object.values(group.dimensions).map(subDim => subDim.key).indexOf(key) !== -1)}
            onChange={event => onChange(event.target.value, event, subDimensions.map(subDim => group.dimensions[subDim].key))}
            input={<Input id="select-multiple-checkbox" />}
            renderValue={selected => Object.keys(group.dimensions).filter(key => selected.indexOf(group.dimensions[key].key) !== -1 ).join(', ') }
            MenuProps={MenuProps}
          >
            {subDimensions.map(subDim => (
              <MenuItem 
                key={group.dimensions[subDim].key}
                value={group.dimensions[subDim].key}>
                <Checkbox checked={value.indexOf(group.dimensions[subDim].key) !== -1} />
                <ListItemText primary={subDim} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </TableCell>
    }
  </TableRow>,
  checkPropsChange)

class TableSelect extends PureComponent {
  state = {
    dimensions: {},
    currentPage: 0,
    perPage: 10,
    filter: '',
    depthFilter: '',
    groups: {},
    filteredGroups: [],
    inSelectionFilter: false
  }

  handleChange(key, event, originalKeysSet) {
    const value =
      Array.isArray(key) ? 
        [ ...this.props.value, ...key.filter(k => this.props.value.indexOf(k) === -1) ].filter(k => originalKeysSet.indexOf(k) === -1 || key.indexOf(k) !== -1)
        // add array if keys (multi select) to state
        : event.target.checked  
          ? [ ...this.props.value, key ] // add key to state
          : this.props.value.filter(v => v!== key)
    // this.setState({ value }) // remove key from state
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

  onChangeSelectionFilter(event) {
    this.setState({
      inSelectionFilter: event.target.checked,
      currentPage: 0
    })
    this.applyFilters()
  }

  handleChangePage(event, page) {
    this.setState({
      currentPage: page
    })
  }

  handleChangeRowsPerPage(event) {
    this.setState({
      perPage: parseInt(event.target.value, 10)
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
      }
    }

    // Return null if the state hasn't changed
    return null;
  }

  getSubDimKeys(subDim) {
    return this.state.filteredGroups.map(groupKey => this.state.groups[groupKey].dimensions?.[subDim].key)
  }

  filterKeysFromGroup(groupKey, values) {
    return Object.values(this.state.groups[groupKey].dimensions)
      .map(({ key }) => key)
      .filter(key => values.indexOf(key) !== -1)
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

  onChangeSelectSubDim(subDim, event, originalSubdimensionsSet) {
    let keys = []
    let value = []
    if (Array.isArray(subDim)) { // Collapsed mode - select
      keys = subDim.reduce((all, subDim) => [ ...all, ...this.getSubDimKeys(subDim) ], [])
      const originalSubdimensionsSetKeys = originalSubdimensionsSet.reduce((all, subDim) => [ ...all, ...this.getSubDimKeys(subDim) ], [])
      value = this.mergeValues(this.props.value, keys).filter(v => originalSubdimensionsSetKeys.indexOf(v) === -1 || keys.indexOf(v) !== -1)

    } else { // Expanded mode - checkboxes
      keys = this.getSubDimKeys(subDim)
      value = event.target.checked 
        ? this.mergeValues(this.props.value, keys)
        : this.props.value.filter(v => keys.indexOf(v) === -1)
    }
    
    // this.setState({ value })
    this.props.onChange(value)
  }

  applyFilters() {
    this.setState(state => {
      const filterRegex = RegExp(state.filter, 'gi')
      return { 
        filteredGroups: Object.keys(state.groups).filter(groupKey => 
          (!state.inSelectionFilter || Object.values(state.groups[groupKey].dimensions).reduce((result, dimension) => result || this.props.value.indexOf(dimension.key) !== -1, false)) &&
          filterRegex.test(state.groups[groupKey].label) &&
          (state.depthFilter === "" || state.groups[groupKey].depth === state.depthFilter))
      }
    })
  }

  // Display selection
  render () {
    logger.log('TS: rendering')
    const { classes } = this.props
    const {
      groups,
      subDimensions,
      filteredGroups,
      perPage,
      currentPage,
      depthFilter,
      inSelectionFilter } = this.state
    const { value } = this.props

    const slicedGroups = filteredGroups
      .slice(currentPage * perPage, (currentPage + 1) * perPage)
      .reduce((gps, key) => ({ ...gps, [key]: groups[key] }), {}) 

    let { verticalSelectionLimit, dimensionsGroupsComponent } = this.props
    dimensionsGroupsComponent = dimensionsGroupsComponent || 'auto'
    dimensionsGroupsComponent = dimensionsGroupsComponent === 'expanded' ||
      dimensionsGroupsComponent === 'auto' && subDimensions.length <= 5
        ? 'expanded'
        : 'collapsed'

    verticalSelectionLimit = verticalSelectionLimit || 20
    const jsx = <>
      <Table className={classes.table}  size="small">
        <TableHead>
          <TableRow>
            <TableCell>
            <FormControlLabel
                control={<Checkbox
                  onChange={this.onChangeSelectionFilter.bind(this)}
                  checked={inSelectionFilter} />}
                label="Filtrer les entrées sélectionnées"
                labelPlacement="end"
              />
            </TableCell>
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
            <TableCell colSpan={dimensionsGroupsComponent === 'expanded'
                ? 2
                : 1 }>
              <FormControl margin="normal">
                <InputLabel 
                  style={{whiteSpace: 'nowrap'}}
                  shrink htmlFor="level">Niveau des catégories</InputLabel>
                <Select
                  id="level"
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
              onChangeRowsPerPage={this.handleChangeRowsPerPage.bind(this)}
              />
          </TableRow>
          <TableRow>
            <TableCell colSpan={dimensionsGroupsComponent === 'expanded' ? 1 : 2 }>
              Série
            </TableCell>
            {dimensionsGroupsComponent === 'expanded'
                ? subDimensions.map(dimension => <TableCell key={dimension}>
                  <FormControlLabel
                    classes={{ label: classes.headSelectors }}
                    control={<Checkbox
                      disabled={Object.keys(filteredGroups).length > verticalSelectionLimit}
                      onChange={this.onChangeSelectSubDim.bind(this, dimension)}
                      checked={this.isAllIncluded(value, this.getSubDimKeys(dimension))}
                      />}
                    label={dimension}
                    labelPlacement="end"
                  />
                </TableCell>)
                : <TableCell colSpan={50}>
                <FormControl className={classes.formControl}>
                  <InputLabel htmlFor="select-multiple-checkbox">Dimensions</InputLabel>
                  <Select
                    multiple
                    autoWidth={true}
                    disabled={Object.keys(filteredGroups).length > verticalSelectionLimit}
                    value={subDimensions.filter(dimension =>
                      this.isAllIncluded(value, this.getSubDimKeys(dimension)))}
                    onChange={event => this.onChangeSelectSubDim(event.target.value, event, subDimensions)}
                    input={<Input id="select-multiple-checkbox" />}
                    renderValue={selected => subDimensions.filter(dimension => this.isAllIncluded(value, this.getSubDimKeys(dimension))).join(', ') }
                    MenuProps={MenuProps}
                  >
                    {subDimensions.map(subDim => (
                      <MenuItem 
                        key={subDim}
                        value={subDim}>
                        <Checkbox checked={this.isAllIncluded(value, this.getSubDimKeys(subDim))} />
                        <ListItemText primary={subDim} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
            }
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.keys(slicedGroups).map(groupKey =>
            <RowGroup
              key={groupKey}
              classes={classes}
              group={groups[groupKey]}
              subDimensions={subDimensions}
              dimensionsGroupsComponent={dimensionsGroupsComponent}
              onChange={this.handleChange.bind(this)}
              value={this.filterKeysFromGroup(groupKey, value)}
              />)}
        </TableBody>
      </Table>
    </>

    logger.log('TS: end render')
    return jsx
  }
}

export default withStyles(theme => ({
  headSelectors: {
    fontSize: '0.9em'
  },
  table: {
    minWidth: '100%'
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
    maxWidth: 300,
  }
}), { withTheme: true })(TableSelect)