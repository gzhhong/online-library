import { useState } from 'react';
import MatchLawyerLayout from '../../components/MatchLawyerLayout';
import { Box, Typography, Paper, Switch, FormControlLabel } from '@mui/material';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: false,
    darkMode: false
  });

  const handleSettingChange = (setting) => (event) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  return (
    <MatchLawyerLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          系统设置
        </Typography>
        
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            基本设置
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSave}
                onChange={handleSettingChange('autoSave')}
              />
            }
            label="自动保存"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.notifications}
                onChange={handleSettingChange('notifications')}
              />
            }
            label="启用通知"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.darkMode}
                onChange={handleSettingChange('darkMode')}
              />
            }
            label="深色模式"
          />
        </Paper>
      </Box>
    </MatchLawyerLayout>
  );
} 