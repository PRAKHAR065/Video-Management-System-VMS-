import React from 'react';
import { Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

function AlertBadge({ count }) {
  return (
    <Badge badgeContent={count} color="error">
      <NotificationsIcon />
    </Badge>
  );
}

export default AlertBadge;