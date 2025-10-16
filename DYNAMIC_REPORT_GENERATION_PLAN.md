# Dynamic Report Generation System - Implementation Plan

## 📋 Project Overview

**Objective**: Implement a dynamic report generation system similar to the existing quotation system, enabling users to generate test reports with pre-filled data, image uploads, and checklist validation.

**Feasibility Rating**: 9/10 - Highly feasible with existing infrastructure

---

## 🎯 Report Requirements Checklist

### Core Report Elements
- [x] Report Number (Auto-generated)
- [x] Report Type (NABL/NON-NABL)
- [x] Customer Details (Pre-filled from job card)
- [x] EUT Details (Pre-filled from test data)
- [x] Test Conducted Details (Pre-filled from database)
- [ ] Test Photos (User upload required)
- [ ] Test Graphs (User upload required)
- [ ] Report Preview & Image Alignment (User preview and adjust required)
- [x] Report Prepared By (Auto-filled from user context)
- [ ] Report Reviewed By (User selection required)
- [ ] Required Signatures (User confirmation required)
- [ ] QR Code Generated/NABL Uploaded (Auto-generated)

---

## 🏗️ Technical Architecture

### Current System Advantages
✅ **Proven Document Generation**: Using Docxtemplater + template approach
✅ **Image Embedding**: Company logo functionality already working
✅ **Dialog System**: Material-UI dialog patterns established
✅ **File Upload**: Drag-and-drop upload components exist
✅ **Database Schema**: Comprehensive test tracking tables present

### Database Tables Involved
- `tests_details` - Primary test data
- `emi_tests_details_table` - EMI test specifics
- `jc_tests` - Job card test mapping
- `eut_details` - Equipment under test information
- `bea_jobcards` - Job card master data

---

## 📊 Implementation Phases

### Phase 1: Database Schema Enhancement (Week 1)
**Goal**: Extend existing tables to support report generation

```sql
-- Add report-specific columns to tests_details table
ALTER TABLE tests_details ADD COLUMN test_photos TEXT;
ALTER TABLE tests_details ADD COLUMN test_graphs TEXT;
ALTER TABLE tests_details ADD COLUMN report_checklist TEXT;
ALTER TABLE tests_details ADD COLUMN qr_code VARCHAR(500);
ALTER TABLE tests_details ADD COLUMN signatures_obtained VARCHAR(500);

-- Create dedicated reports tracking table
CREATE TABLE test_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_number VARCHAR(255) UNIQUE,
    jc_number VARCHAR(255),
    test_id INT,
    report_type ENUM('NABL', 'NON_NABL'),
    report_status ENUM('draft', 'ready_for_download', 'completed'),
    checklist_completion JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests_details(id)
);
```

### Phase 2: Backend API Development (Week 1-2)
**Goal**: Create report generation endpoints

**New API Endpoints Needed:**
- `GET /api/report/test-details/:testId` - Get pre-filled report data
- `POST /api/report/generate` - Generate report with uploaded files
- `PUT /api/report/update-checklist/:reportId` - Update checklist status
- `POST /api/report/upload-files` - Handle photo/graph uploads
- `GET /api/report/generate-qr/:reportNumber` - Generate QR code

### Phase 3: Frontend Components (Week 2-3)
**Goal**: Create report generation UI components

#### Component Structure
```
src/Reports/
├── ReportGenerationDialog.js     - Main report dialog (based on DocToPdf.js)
├── ReportChecklist.js            - Checklist validation component
├── ReportImageUpload.js          - Multi-file upload component
├── ReportPreview.js              - Live preview with image positioning
├── ImageAlignmentEditor.js       - Drag-and-drop image positioning
├── ReportTemplateManager.js      - Template selection logic
└── templates/
    ├── Environmental_Report.docx - Environmental testing template
    ├── EMI_Report.docx           - EMI/EMC testing template
    └── Reliability_Report.docx   - Reliability testing template
```

#### Key Features to Implement
- **Pre-filled Form**: Auto-populate from test data
- **Multi-file Upload**: Photos and graphs with preview
- **Live Report Preview**: Visual representation before generation
- **Image Alignment Editor**: Drag-and-drop positioning interface
- **Checklist Validation**: Enable download only when complete
- **Template Selection**: Based on test type
- **QR Code Generation**: For NABL compliance

### Phase 4: Integration & Testing (Week 3-4)
**Goal**: Integrate with existing test management pages

#### Integration Points
- **Test Details Pages**: Add "Generate Report" button
- **Job Card Dashboard**: Report status indicators
- **Test Management**: Bulk report generation capability

---

## 💻 Code Implementation Examples

### Report Generation Dialog Component
```javascript
// ReportGenerationDialog.js - Similar to DocToPdf.js structure
const ReportGenerationDialog = ({
  testDetails,
  jcNumber,
  onClose
}) => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportChecklist, setReportChecklist] = useState(INITIAL_CHECKLIST);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedGraphs, setUploadedGraphs] = useState([]);
  const [reportType, setReportType] = useState('NABL');
  const [reviewedBy, setReviewedBy] = useState('');

  // Reuse image upload logic from DocToPdf.js
  // Add multi-file support
  // Implement checklist validation

  const generateReport = async () => {
    // Similar to generatePDF() in DocToPdf.js
    // Include multiple images in template
    // Generate QR code
    // Save report metadata to database
  };
};
```

### Report Checklist Validation
```javascript
const REPORT_CHECKLIST = {
  reportNumber: { required: true, completed: false, autoFill: true },
  reportType: { required: true, completed: false, userInput: true },
  customerDetails: { required: true, completed: false, autoFill: true },
  eutDetails: { required: true, completed: false, autoFill: true },
  testDetails: { required: true, completed: false, autoFill: true },
  testPhotos: { required: true, completed: false, minFiles: 1 },
  testGraphs: { required: true, completed: false, minFiles: 1 },
  preparedBy: { required: true, completed: false, autoFill: true },
  reviewedBy: { required: true, completed: false, userInput: true },
  signatures: { required: true, completed: false, userInput: true },
  qrCode: { required: false, completed: false, autoGenerate: true }
};
```

### Template Data Mapping
```javascript
const buildReportTemplateData = (testDetails, uploadedFiles) => {
  return {
    REPORT_NUMBER: generateReportNumber(),
    REPORT_TYPE: reportType,
    CUSTOMER_NAME: testDetails.companyName,
    CUSTOMER_ADDRESS: testDetails.companyAddress,
    EUT_DESCRIPTION: testDetails.eutDescription,
    EUT_SERIAL_NUMBER: testDetails.eutSerialNo,
    EUT_PART_NUMBER: testDetails.partNo,
    TEST_NAME: testDetails.testName,
    TEST_START_DATE: formatDate(testDetails.startDate),
    TEST_END_DATE: formatDate(testDetails.endDate),
    TEST_DURATION: testDetails.duration,
    TEST_OBSERVATIONS: testDetails.remarks,
    PREPARED_BY: loggedInUser.name,
    REVIEWED_BY: reviewedBy,
    QR_CODE: generateQRCode(),
    // Dynamic image placeholders
    test_photo_1: 'test_photo_1',
    test_photo_2: 'test_photo_2',
    test_graph_1: 'test_graph_1',
    test_graph_2: 'test_graph_2'
  };
};
```

---

## 🎨 User Experience Flow

### Enhanced Report Generation Workflow
1. **User clicks "Generate Report" button** in test details view
2. **System opens ReportGenerationDialog** with pre-filled data
3. **User uploads required photos and graphs**
4. **System shows live preview** with default image positioning
5. **User adjusts image alignment** using drag-and-drop interface
6. **User previews final report layout** before generation
7. **System validates checklist completion**
8. **Download button enables** when all items checked
9. **User clicks "Generate Report"**
10. **System processes template with positioned images**
11. **Document downloads** as .docx file
12. **Report metadata saved** to database

### Checklist Validation UI
```javascript
// Visual checklist component
const ChecklistItem = ({ item, status }) => (
  <Box display="flex" alignItems="center" py={1}>
    <CheckCircle color={status ? "success" : "disabled"} />
    <Typography variant="body2" sx={{ ml: 1, opacity: status ? 1 : 0.6 }}>
      {item.label}
    </Typography>
  </Box>
);
```

---

## 🎯 Image Alignment & Preview Challenge Solutions

### The Challenge
**Problem**: Working with Word templates (.docx) limits direct image positioning control compared to HTML/CSS. Users need to preview and adjust image alignment before final report generation.

**Solution Approach**: Create a visual preview interface that maps to template positioning options.

### 🖼️ Solution 1: Template-Based Positioning System (Recommended)

#### Pre-defined Image Zones in Templates
```xml
<!-- In Word template: Environmental_Report.docx -->
<!-- Create multiple image placeholders with different alignment options -->

{test_photo_1_left}     <!-- Left-aligned image -->
{test_photo_1_center}   <!-- Center-aligned image -->
{test_photo_1_right}    <!-- Right-aligned image -->
{test_photo_1_full}     <!-- Full-width image -->

{test_graph_1_left}
{test_graph_1_center}
{test_graph_1_right}
{test_graph_1_full}
```

#### Visual Alignment Editor Component
```javascript
// ImageAlignmentEditor.js
const ImageAlignmentEditor = ({ images, onPositionChange }) => {
  const [imagePositions, setImagePositions] = useState({});

  const alignmentOptions = [
    { key: 'left', label: 'Left Align', icon: <AlignLeftIcon /> },
    { key: 'center', label: 'Center', icon: <AlignCenterIcon /> },
    { key: 'right', label: 'Right Align', icon: <AlignRightIcon /> },
    { key: 'full', label: 'Full Width', icon: <FullWidthIcon /> }
  ];

  const handlePositionChange = (imageId, position, size) => {
    setImagePositions(prev => ({
      ...prev,
      [imageId]: { position, size }
    }));
    onPositionChange(imageId, position, size);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      {images.map((image, index) => (
        <Card key={index} sx={{ mb: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                style={{ width: '100%', maxHeight: '100px', objectFit: 'contain' }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Position: {image.name}
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                {alignmentOptions.map(option => (
                  <Button
                    key={option.key}
                    variant={imagePositions[image.id]?.position === option.key ? 'contained' : 'outlined'}
                    onClick={() => handlePositionChange(image.id, option.key, 'medium')}
                    startIcon={option.icon}
                  >
                    {option.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Grid>

            <Grid item xs={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={imagePositions[image.id]?.size || 'medium'}
                  onChange={(e) => handlePositionChange(image.id, imagePositions[image.id]?.position || 'center', e.target.value)}
                >
                  <MenuItem value="small">Small (25%)</MenuItem>
                  <MenuItem value="medium">Medium (50%)</MenuItem>
                  <MenuItem value="large">Large (75%)</MenuItem>
                  <MenuItem value="full">Full Width (100%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>
      ))}
    </Box>
  );
};
```

### 🔍 Solution 2: Live Preview System

#### React-Based Report Preview
```javascript
// ReportPreview.js - Visual representation of final document
const ReportPreview = ({ reportData, imagePositions }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        backgroundColor: 'white',
        minHeight: '800px',
        width: '210mm', // A4 width
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4">{reportData.REPORT_TITLE}</Typography>
        <Typography variant="h6">Report No: {reportData.REPORT_NUMBER}</Typography>
      </Box>

      {/* Customer Details */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="h6">Customer Details:</Typography>
          <Typography>{reportData.CUSTOMER_NAME}</Typography>
          <Typography>{reportData.CUSTOMER_ADDRESS}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h6">EUT Details:</Typography>
          <Typography>{reportData.EUT_DESCRIPTION}</Typography>
          <Typography>S/N: {reportData.EUT_SERIAL_NUMBER}</Typography>
        </Grid>
      </Grid>

      {/* Test Images Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Test Photos:</Typography>
        {reportData.testPhotos?.map((photo, index) => {
          const position = imagePositions[photo.id];
          return (
            <Box
              key={index}
              sx={{
                mb: 2,
                textAlign: position?.position === 'left' ? 'left' :
                          position?.position === 'right' ? 'right' : 'center',
                width: position?.size === 'full' ? '100%' :
                       position?.size === 'large' ? '75%' :
                       position?.size === 'small' ? '25%' : '50%',
                margin: position?.position === 'center' ? '0 auto' : '0',
                marginLeft: position?.position === 'right' ? 'auto' : '0'
              }}
            >
              <img
                src={photo.preview}
                alt={`Test Photo ${index + 1}`}
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {photo.caption || `Test Photo ${index + 1}`}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Test Graphs Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Test Graphs:</Typography>
        {/* Similar structure for graphs */}
      </Box>
    </Paper>
  );
};
```

### 🎛️ Solution 3: Advanced Template System

#### Dynamic Template Generation
```javascript
// ReportTemplateManager.js - Handle multiple template variations
const ReportTemplateManager = {

  // Generate template data based on image positions
  generateTemplateData: (reportData, imagePositions) => {
    const templateData = { ...reportData };

    // Clear all image placeholders first
    const positions = ['left', 'center', 'right', 'full'];
    const sizes = ['small', 'medium', 'large'];

    positions.forEach(pos => {
      sizes.forEach(size => {
        templateData[`test_photo_1_${pos}_${size}`] = null;
        templateData[`test_graph_1_${pos}_${size}`] = null;
      });
    });

    // Set active image placeholders based on user selection
    reportData.testPhotos?.forEach((photo, index) => {
      const position = imagePositions[photo.id];
      if (position) {
        const key = `test_photo_${index + 1}_${position.position}_${position.size}`;
        templateData[key] = `test_photo_${index + 1}`;
      }
    });

    reportData.testGraphs?.forEach((graph, index) => {
      const position = imagePositions[graph.id];
      if (position) {
        const key = `test_graph_${index + 1}_${position.position}_${position.size}`;
        templateData[key] = `test_graph_${index + 1}`;
      }
    });

    return templateData;
  },

  // Get image with size and positioning for docxtemplater
  getImageWithPositioning: function(tagValue, imagePositions, uploadedImages) {
    const [type, number, position, size] = tagValue.split('_');

    const imageKey = `${type}_${number}`;
    const image = uploadedImages.find(img => img.key === imageKey);

    if (!image) return null;

    // Apply size transformation based on position
    const sizeMultiplier = {
      small: 0.25,
      medium: 0.5,
      large: 0.75,
      full: 1.0
    };

    return {
      imageBuffer: image.buffer,
      width: image.originalWidth * sizeMultiplier[size],
      height: image.originalHeight * sizeMultiplier[size]
    };
  }
};
```

### 📐 Solution 4: Template Design Strategy

#### Multi-Layout Template Approach
```xml
<!-- Word Template Structure -->

<!-- Section 1: Customer & EUT Details (Fixed) -->
<w:tbl>
  <w:tr>
    <w:tc>Customer: {CUSTOMER_NAME}</w:tc>
    <w:tc>EUT: {EUT_DESCRIPTION}</w:tc>
  </w:tr>
</w:tbl>

<!-- Section 2: Test Photos (Dynamic Layout) -->
<w:p><w:t>Test Photos:</w:t></w:p>

<!-- Left-aligned photos -->
{#test_photos_left}
<w:p>
  <w:pPr><w:jc w:val="left"/></w:pPr>
  <w:r><w:drawing>{%image}</w:drawing></w:r>
</w:p>
{/test_photos_left}

<!-- Center-aligned photos -->
{#test_photos_center}
<w:p>
  <w:pPr><w:jc w:val="center"/></w:pPr>
  <w:r><w:drawing>{%image}</w:drawing></w:r>
</w:p>
{/test_photos_center}

<!-- Right-aligned photos -->
{#test_photos_right}
<w:p>
  <w:pPr><w:jc w:val="right"/></w:pPr>
  <w:r><w:drawing>{%image}</w:drawing></w:r>
</w:p>
{/test_photos_right}
```

### 🔄 Implementation Workflow

#### Enhanced Report Generation Dialog
```javascript
// ReportGenerationDialog.js - Updated with preview
const ReportGenerationDialog = ({ testDetails, onClose }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Align, 3: Preview
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePositions, setImagePositions] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { label: 'Upload Images', component: <ReportImageUpload /> },
    { label: 'Adjust Alignment', component: <ImageAlignmentEditor /> },
    { label: 'Preview Report', component: <ReportPreview /> }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Dialog open={true} maxWidth="lg" fullWidth>
      <DialogTitle>
        Generate Report - Step {step}: {steps[step - 1].label}
      </DialogTitle>

      <DialogContent sx={{ minHeight: '600px' }}>
        <Stepper activeStep={step - 1} sx={{ mb: 3 }}>
          {steps.map((stepInfo, index) => (
            <Step key={index}>
              <StepLabel>{stepInfo.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 1 && (
          <ReportImageUpload
            onImagesUploaded={setUploadedImages}
            images={uploadedImages}
          />
        )}

        {step === 2 && (
          <ImageAlignmentEditor
            images={uploadedImages}
            positions={imagePositions}
            onPositionChange={setImagePositions}
          />
        )}

        {step === 3 && (
          <ReportPreview
            reportData={testDetails}
            imagePositions={imagePositions}
            uploadedImages={uploadedImages}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        {step < 3 ? (
          <Button onClick={handleNext} variant="contained">
            Next
          </Button>
        ) : (
          <Button onClick={generateFinalReport} variant="contained" color="success">
            Generate Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
```

### 🎯 React DnD Implementation (Recommended Library Solution)

#### Installation and Setup
```bash
npm install react-dnd react-dnd-html5-backend
```

#### Core Components Structure
```javascript
// ReportLayoutEditor.js - Main drag-and-drop interface
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { Grid, Paper, Typography, Box } from '@mui/material';

const ReportLayoutEditor = ({ images, onLayoutChange }) => {
  const [layout, setLayout] = useState({
    leftZone: [],
    centerZone: [],
    rightZone: [],
    fullWidthZone: []
  });

  const handleDrop = (imageId, zone) => {
    // Remove image from current zone
    const newLayout = { ...layout };
    Object.keys(newLayout).forEach(key => {
      newLayout[key] = newLayout[key].filter(img => img.id !== imageId);
    });

    // Add to new zone
    const image = images.find(img => img.id === imageId);
    if (image) {
      newLayout[zone] = [...newLayout[zone], image];
    }

    setLayout(newLayout);
    onLayoutChange(newLayout);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Paper elevation={2} sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Typography variant="h6" gutterBottom>
          📐 Drag Images to Position Them in Report
        </Typography>

        <Grid container spacing={2} sx={{ minHeight: '400px' }}>
          {/* Left Alignment Zone */}
          <Grid item xs={4}>
            <DropZone
              zone="leftZone"
              title="Left Aligned"
              onDrop={handleDrop}
              backgroundColor="#e3f2fd"
            >
              {layout.leftZone.map(img => (
                <DraggableImage key={img.id} image={img} />
              ))}
            </DropZone>
          </Grid>

          {/* Center Alignment Zone */}
          <Grid item xs={4}>
            <DropZone
              zone="centerZone"
              title="Center Aligned"
              onDrop={handleDrop}
              backgroundColor="#e8f5e8"
            >
              {layout.centerZone.map(img => (
                <DraggableImage key={img.id} image={img} />
              ))}
            </DropZone>
          </Grid>

          {/* Right Alignment Zone */}
          <Grid item xs={4}>
            <DropZone
              zone="rightZone"
              title="Right Aligned"
              onDrop={handleDrop}
              backgroundColor="#fff3e0"
            >
              {layout.rightZone.map(img => (
                <DraggableImage key={img.id} image={img} />
              ))}
            </DropZone>
          </Grid>

          {/* Full Width Zone */}
          <Grid item xs={12}>
            <DropZone
              zone="fullWidthZone"
              title="Full Width Images"
              onDrop={handleDrop}
              backgroundColor="#f3e5f5"
              height="150px"
            >
              {layout.fullWidthZone.map(img => (
                <DraggableImage key={img.id} image={img} isFullWidth />
              ))}
            </DropZone>
          </Grid>
        </Grid>

        {/* Unused Images Pool */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            📤 Available Images (Drag to Position)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {images.filter(img => !isImageInLayout(img.id, layout)).map(img => (
              <DraggableImage key={img.id} image={img} />
            ))}
          </Box>
        </Box>
      </Paper>
    </DndProvider>
  );
};

// Helper function to check if image is already positioned
const isImageInLayout = (imageId, layout) => {
  return Object.values(layout).some(zone =>
    zone.some(img => img.id === imageId)
  );
};
```

#### Draggable Image Component
```javascript
// DraggableImage.js - Individual draggable image
const DraggableImage = ({ image, isFullWidth = false }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'IMAGE',
    item: {
      id: image.id,
      type: 'IMAGE',
      name: image.name
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '2px solid #e0e0e0',
        borderRadius: 2,
        padding: 1,
        backgroundColor: 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#1976d2',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        },
        width: isFullWidth ? '200px' : '120px',
        height: 'auto'
      }}
    >
      <img
        src={image.preview}
        alt={image.name}
        style={{
          width: '100%',
          height: '80px',
          objectFit: 'cover',
          borderRadius: '4px'
        }}
      />
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          fontSize: '0.7rem'
        }}
      >
        {image.name}
      </Typography>
    </Box>
  );
};
```

#### Drop Zone Component
```javascript
// DropZone.js - Target zones for image positioning
const DropZone = ({
  zone,
  title,
  onDrop,
  children,
  backgroundColor = '#f5f5f5',
  height = '200px'
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'IMAGE',
    drop: (item) => {
      onDrop(item.id, zone);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const isActive = isOver && canDrop;

  return (
    <Paper
      ref={drop}
      elevation={isActive ? 4 : 1}
      sx={{
        minHeight: height,
        backgroundColor: isActive ? '#c8e6c9' : backgroundColor,
        border: `2px dashed ${isActive ? '#4caf50' : '#bdbdbd'}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: children.length > 0 ? 'flex-start' : 'center',
        padding: 2,
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          color: isActive ? '#2e7d32' : '#666',
          mb: 1
        }}
      >
        {title}
      </Typography>

      {children.length === 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
          Drop images here for<br />{title.toLowerCase()} positioning
        </Typography>
      )}

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '100%'
      }}>
        {children}
      </Box>
    </Paper>
  );
};
```

#### Integration with Report Generation Dialog
```javascript
// Updated ReportGenerationDialog.js with React DnD
const ReportGenerationDialog = ({ testDetails, onClose }) => {
  const [step, setStep] = useState(1);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageLayout, setImageLayout] = useState({
    leftZone: [],
    centerZone: [],
    rightZone: [],
    fullWidthZone: []
  });

  const steps = [
    { label: 'Upload Images', component: 'upload' },
    { label: 'Position Images', component: 'position' },
    { label: 'Preview Report', component: 'preview' }
  ];

  const handleLayoutChange = (newLayout) => {
    setImageLayout(newLayout);
  };

  const generateTemplateData = () => {
    const templateData = { ...testDetails };

    // Map layout to template placeholders
    imageLayout.leftZone.forEach((img, index) => {
      templateData[`test_photo_left_${index + 1}`] = `test_photo_${img.id}`;
    });

    imageLayout.centerZone.forEach((img, index) => {
      templateData[`test_photo_center_${index + 1}`] = `test_photo_${img.id}`;
    });

    imageLayout.rightZone.forEach((img, index) => {
      templateData[`test_photo_right_${index + 1}`] = `test_photo_${img.id}`;
    });

    imageLayout.fullWidthZone.forEach((img, index) => {
      templateData[`test_photo_full_${index + 1}`] = `test_photo_${img.id}`;
    });

    return templateData;
  };

  return (
    <Dialog open={true} maxWidth="xl" fullWidth>
      <DialogTitle>
        Generate Report - Step {step}: {steps[step - 1].label}
      </DialogTitle>

      <DialogContent sx={{ minHeight: '700px', p: 3 }}>
        <Stepper activeStep={step - 1} sx={{ mb: 3 }}>
          {steps.map((stepInfo, index) => (
            <Step key={index}>
              <StepLabel>{stepInfo.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 1 && (
          <ReportImageUpload
            onImagesUploaded={setUploadedImages}
            images={uploadedImages}
          />
        )}

        {step === 2 && (
          <ReportLayoutEditor
            images={uploadedImages}
            onLayoutChange={handleLayoutChange}
          />
        )}

        {step === 3 && (
          <ReportPreviewWithLayout
            reportData={testDetails}
            imageLayout={imageLayout}
            uploadedImages={uploadedImages}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          variant="outlined"
        >
          Back
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            variant="contained"
            disabled={step === 2 && Object.values(imageLayout).every(zone => zone.length === 0)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => generateFinalReport(generateTemplateData())}
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
          >
            Generate Report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
```

#### Template Data Generation for Docxtemplater
```javascript
// Enhanced template data generation based on DnD layout
const generateDocxTemplateData = (reportData, imageLayout, uploadedImages) => {
  const templateData = { ...reportData };

  // Clear all image placeholders
  const zones = ['left', 'center', 'right', 'full'];
  zones.forEach(zone => {
    for (let i = 1; i <= 5; i++) {
      templateData[`test_photo_${zone}_${i}`] = null;
      templateData[`test_graph_${zone}_${i}`] = null;
    }
  });

  // Set active image placeholders based on layout
  Object.entries(imageLayout).forEach(([zoneKey, images]) => {
    const zone = zoneKey.replace('Zone', ''); // leftZone -> left

    images.forEach((image, index) => {
      const templateKey = `test_${image.type}_${zone}_${index + 1}`;
      templateData[templateKey] = `test_${image.type}_${image.id}`;
    });
  });

  return templateData;
};
```

### ⚡ Performance Optimizations

#### Image Processing Pipeline with React DnD
```javascript
// Optimize images before processing
const processImageForTemplate = async (file, position, size) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions based on position and size
      const maxWidths = {
        small: 200,
        medium: 400,
        large: 600,
        full: 800
      };

      const maxWidth = maxWidths[size];
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);

      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.src = URL.createObjectURL(file);
  });
};
```

---

## 🔧 Technical Considerations

### File Upload Enhancements
- **Multiple File Support**: Extend single image upload to handle arrays
- **File Type Validation**: Accept .jpg, .png, .pdf for photos/graphs
- **File Size Limits**: Implement compression for large images
- **Preview Functionality**: Show thumbnails before upload

### QR Code Integration
```javascript
import QRCode from 'qrcode';

const generateQRCode = async (reportData) => {
  const qrString = `NABL-${reportData.reportNumber}-${reportData.jcNumber}`;
  const qrCodeDataURL = await QRCode.toDataURL(qrString);
  return qrCodeDataURL;
};
```

### Template Management
- **Template Selection Logic**: Based on test type/category
- **Dynamic Placeholders**: Support variable number of images
- **Template Versioning**: Handle template updates gracefully

---

## 📅 Timeline & Milestones

| Week | Phase | Deliverables | Success Criteria |
|------|-------|--------------|------------------|
| 1 | Database & Backend | Schema updates, API endpoints | APIs tested with Postman |
| 2 | Frontend Components | Dialog, upload, checklist components | Components render correctly |
| 3 | Integration | Connect with test pages, template processing | End-to-end report generation |
| 4 | Testing & Polish | Bug fixes, performance optimization | User acceptance testing |

---

## 🚀 Success Factors

### Leverage Existing Infrastructure
- **~60% Code Reusable** from quotation system
- **Proven Architecture**: Template + dialog + validation pattern
- **Database Ready**: Minimal schema changes required
- **User Familiar**: Same workflow as quotation generation

### Quality Assurance
- **Checklist Validation**: Ensures report completeness
- **Template Consistency**: Professional document output
- **Error Handling**: Robust file upload and processing
- **User Feedback**: Clear progress indicators and validation messages

---

## 📞 Communication Guide

### Status Updates
- **Daily**: Component development progress
- **Weekly**: Phase completion and blockers
- **Milestone**: Demo of working features

### Decision Points
- **Template Design**: Review report templates for each test type
- **Checklist Items**: Confirm required vs optional fields
- **File Upload Limits**: Determine size and format restrictions
- **QR Code Content**: Define QR code data structure

### Testing Scenarios
- **Happy Path**: Complete report generation with all uploads
- **Validation**: Attempt download with incomplete checklist
- **Error Handling**: Network failures, large file uploads
- **Edge Cases**: Multiple simultaneous reports, template errors

---

## 📚 References

### Existing Code to Study
- `frontend/src/Quote/DocToPdf.js` - Document generation pattern
- `frontend/src/Quote/Quotation.js` - Form validation and data handling
- `Backend/database_tables.js` - Database schema patterns
- `frontend/src/templates/` - Template management examples

### Key Dependencies
- `docxtemplater` - Document template processing
- `docxtemplater-image-module-free` - Image embedding
- `qrcode` - QR code generation
- `file-saver` - Document download handling

---

*This document serves as the master reference for the Dynamic Report Generation System implementation. Update this file as the project evolves and requirements change.*