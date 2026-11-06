import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

/** One section of the report builder, in its own card */
export default function SectionCard({ title, subtitle, action, children, sx }) {
  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, ...sx }}>
      <CardContent sx={{ "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: subtitle || children ? 1 : 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {typeof title === "string" ? (
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            ) : (
              title
            )}
          </Box>
          {action}
        </Stack>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1.5 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
