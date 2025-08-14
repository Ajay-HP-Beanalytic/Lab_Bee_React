import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  InfoOutlined,
} from '@mui/icons-material';
import CountUp from 'react-countup';

const EnhancedKpiCard = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = '#1976d2',
  bgColor = '#f8faff',
  progress,
  chips = [],
  tooltip,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const iconProps = {
      fontSize: 'small',
      sx: { ml: 0.5 }
    };
    
    switch (trend) {
      case 'up':
        return <TrendingUp {...iconProps} sx={{ ...iconProps.sx, color: '#4caf50' }} />;
      case 'down':
        return <TrendingDown {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      default:
        return <TrendingFlat {...iconProps} sx={{ ...iconProps.sx, color: '#ff9800' }} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      default: return '#ff9800';
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${bgColor} 0%, #ffffff 100%)`,
        borderRadius: 3,
        border: `1px solid ${color}20`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}20`,
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography
            variant="subtitle1"
            sx={{
              color: '#666',
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Box display="flex" alignItems="center">
            {tooltip && (
              <Tooltip title={tooltip} arrow>
                <IconButton size="small" sx={{ color: '#999', p: 0.5 }}>
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {icon && React.cloneElement(icon, { sx: { color, fontSize: '1.5rem' } })}
          </Box>
        </Box>

        {/* Main Value */}
        <Box flex={1} display="flex" flexDirection="column" justifyContent="center">
          <Typography
            variant="h3"
            sx={{
              color: color,
              fontWeight: 'bold',
              mb: 1,
              lineHeight: 1,
            }}
          >
            {prefix}
            <CountUp
              start={0}
              end={value}
              duration={1.5}
              delay={0.5}
              decimals={decimals}
              separator=","
            />
            {suffix}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: '#888', mb: 1 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Trend Indicator */}
        {(trend || trendValue) && (
          <Box display="flex" alignItems="center" mb={2}>
            {getTrendIcon()}
            {trendValue && (
              <Typography
                variant="body2"
                sx={{
                  color: getTrendColor(),
                  fontWeight: 600,
                  ml: 0.5,
                }}
              >
                {trendValue}
              </Typography>
            )}
          </Box>
        )}

        {/* Progress Bar */}
        {progress !== undefined && (
          <Box mb={2}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: `${color}15`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 3,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{ color: '#666', mt: 0.5, display: 'block' }}
            >
              {Math.round(progress)}% of target
            </Typography>
          </Box>
        )}

        {/* Chips */}
        {chips.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={0.5} mt="auto">
            {chips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                size="small"
                sx={{
                  backgroundColor: chip.color || `${color}15`,
                  color: chip.textColor || color,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedKpiCard;