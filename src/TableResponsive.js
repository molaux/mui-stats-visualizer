import React from 'react';
import Table from '@mui/material/Table';
import { withStyles } from 'tss-react/mui';
const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: '100%',

    marginTop: theme.spacing(3),
    overflowX: 'auto',
  }
})

function TableResponsive(props) {
  const { classes, children, ...otherProps } = props;

  return (
    <div className={classes.root}>
      <Table {...otherProps}>
        {children}
      </Table>
    </div>
  );
}

export default withStyles(TableResponsive, styles);
