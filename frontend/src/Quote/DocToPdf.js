import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  Stack,
  Alert,
} from "@mui/material";
import {
  CloudUpload,
  Delete,
  PictureAsPdf,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import ImageModule from "docxtemplater-image-module-free";
import sizeOf from "image-size";

import TS1Template from "../templates/EnvironmentalQuoteTemplate.docx";
import RETemplate from "../templates/ReliabilityQuoteTemplate.docx";
import ITTemplate from "../templates/ItemSoftQuoteTemplate.docx";
import EMI_EMC_Template from "../templates/EMICQuoteTemplate.docx";

import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { serverBaseAddress } from "../Pages/APIPage";

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

export default function DocToPdf({ id }) {
  // const { id } = useParams('id')

  let defTestDescription = "";
  let defSacNo = "";
  let defDuration = "";
  let defUnit = "";
  let defPerUnitCharge = "";
  let defAmount = "";

  const initialTableData = [
    {
      slno: 1,
      testDescription: defTestDescription,
      sacNo: defSacNo,
      duration: defDuration,
      unit: defUnit,
      perUnitCharge: defPerUnitCharge,
      amount: defAmount,
    },
  ];

  const [toCompanyName, setToCompanyName] = useState("");
  const [toCompanyAddress, setToCompanyAddress] = useState("");
  const [kindAttention, setKindAttention] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContactNumber, setCustomerContactNumber] = useState("");
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [customerIdStr, setCustomerIdStr] = useState("");
  const formattedDate = moment(new Date()).format("DD-MM-YYYY");
  const [quoteGivenDate, setQuoteGivenDate] = useState(formattedDate);
  const [customerReferance, setCustomerReferance] = useState("");

  const [totalAmountInWords, setTotalAmountInWords] = useState("");

  const presentDate = new Date();
  const todaysDate = moment(presentDate).format("DD-MM-YYYY");
  const [quoteCategory, setQuoteCategory] = useState("");
  const [quoteVersion, setQuoteVersion] = useState("");
  const [tableData, setTableData] = useState(initialTableData);
  const [taxableAmount, setTaxableAmount] = useState(0);

  const [quotationTitle, setQuotationTitle] = useState("");
  const [quotationTitleDialog, setQuotationTitleDialog] = useState(true);

  const [companyLogoImage, setCompanyLogoImage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  //const [fileInputRefOfDoc, setFileInputRefOfDoc] = useState(useRef(null));

  // Enhanced image processing functions
  const validateImageFile = (file) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return "Please upload a valid image file (JPG, PNG, GIF, WebP)";
    }

    if (file.size > maxSize) {
      return "Image size must be less than 5MB";
    }

    return null;
  };

  const processImageFile = async (file) => {
    const error = validateImageFile(file);
    if (error) {
      setImageError(error);
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setCompanyLogoImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Store file for processing
      setCompanyLogoFile(file);
      setImageError("");
      toast.success("Image uploaded successfully!");
    } catch (error) {
      setImageError("Failed to process image");
      toast.error("Failed to process image");
    }
  };

  // Function to handle the uploaded image:
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Remove image function
  const removeImage = () => {
    setCompanyLogoImage(null);
    setCompanyLogoFile(null);
    setImagePreview(null);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Function to get image as ArrayBuffer for embedding
  const getImageBuffer = (imageUrl) => {
    return new Promise((resolve, _reject) => {
      if (!imageUrl) {
        resolve(null);
        return;
      }

      try {
        // Convert data URL to ArrayBuffer
        fetch(imageUrl)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch image: ${res.status}`);
            }
            return res.arrayBuffer();
          })
          .then((buffer) => {
            resolve(new Uint8Array(buffer));
          })
          .catch((err) => {
            console.error("Error converting image:", err);
            resolve(null);
          });
      } catch (err) {
        console.error("Error in getImageBuffer:", err);
        resolve(null);
      }
    });
  };

  // Enhanced function to generate the word document with images:
  const generatePDF = async () => {
    let templateDocument = "";

    if (quoteCategory === "Environmental Testing") {
      templateDocument = TS1Template;
    }

    if (
      quoteCategory === "Reliability" ||
      quoteCategory === "Software" ||
      quoteCategory === "Others"
    ) {
      templateDocument = RETemplate;
    }

    if (quoteCategory === "Item Soft") {
      templateDocument = ITTemplate;
    }

    if (quoteCategory === "EMI & EMC") {
      templateDocument = EMI_EMC_Template;
    }

    try {
      // Get image buffer if image exists
      const imageBuffer = await getImageBuffer(companyLogoImage);

      // Configure image module options for docxtemplater-image-module-free
      const imageOptions = {
        centered: false,
        getImage: function (tagValue, tagName) {
          console.log(
            "getImage called with tagValue:",
            tagValue,
            "tagName:",
            tagName
          );
          console.log(
            "Available imageBuffer:",
            imageBuffer ? `${imageBuffer.length} bytes` : "null"
          );

          // tagValue contains the path/identifier from template like 'company_logo'
          if (tagValue === "company_logo") {
            if (imageBuffer && imageBuffer.length > 0) {
              return imageBuffer;
            } else {
              console.error("imageBuffer is null or empty for company_logo");
              throw new Error("Image buffer is not available");
            }
          }

          console.error("No matching image found for tagValue:", tagValue);
          throw new Error(`Image not found for: ${tagValue}`);
        },
        getSize: function (img, _tagValue, _tagName) {
          // img is the actual image buffer returned by getImage()
          try {
            if (img && img.length > 0) {
              // Use image-size library to get dimensions from buffer
              const dimensions = sizeOf(Buffer.from(img));
              console.log("Image dimensions:", dimensions);

              // Calculate aspect ratio and limit max size
              const maxWidth = 200;
              const maxHeight = 100;

              let { width, height } = dimensions;

              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }

              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }

              const finalSize = [Math.round(width), Math.round(height)];
              console.log("Final image size:", finalSize);
              return finalSize;
            }
          } catch (error) {
            console.error("Error calculating image size:", error);
          }

          console.log("Using default image size");
          return [150, 75]; // Default size
        },
      };

      loadFile(templateDocument, function (error, content) {
        if (error) {
          throw error;
        }

        const zip = new PizZip(content);

        // Create document with proper v4 constructor syntax
        console.log("Creating document with docxtemplater v4 constructor...");

        let doc;

        if (imageBuffer) {
          try {
            const imageModule = new ImageModule(imageOptions);
            doc = new Docxtemplater(zip, {
              paragraphLoop: true,
              linebreaks: true,
              modules: [imageModule],
            });
          } catch (moduleError) {
            console.error(
              "Failed to create document with image module:",
              moduleError
            );
            doc = new Docxtemplater(zip, {
              paragraphLoop: true,
              linebreaks: true,
            });
          }
        } else {
          doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
        }

        let newTData = [];
        for (let i = 0; i < tableData.length; i++) {
          newTData[i] = tableData[i];
          newTData[i].module_name = modules[tableData[i].module_id];
        }

        // Set the data for the template including image placeholder
        const templateData = {
          QUOTATIONTITLE: quotationTitle,
          selectedQuotationId: selectedQuotationId,
          quoteVersion: quoteVersion,
          toCompanyName: toCompanyName,
          toCompanyAddress: toCompanyAddress,
          kindAttention: kindAttention,
          customerEmail: customerEmail,
          customerContactNumber: customerContactNumber,
          customerIdStr: customerIdStr,
          quoteGivenDate: quoteGivenDate,
          customerReferance: customerReferance,
          todaysDate: todaysDate,
          taxableAmount: taxableAmount,
          totalAmountInWords: totalAmountInWords,
          dataRows: newTData,
        };

        // Add image placeholder if image is available
        if (imageBuffer) {
          // The value should match what getImage expects in tagValue
          templateData.company_logo = "company_logo";
        } else {
          console.log("No image uploaded - not adding image placeholder");
        }

        try {
          doc.render(templateData);

          // Convert the generated document to a blob
          const blob = doc.getZip().generate({
            type: "blob",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });

          // Save the blob as a file
          const fileName = `QT_${selectedQuotationId}.docx`;
          saveAs(blob, fileName);

          if (imageBuffer) {
            toast.success("Document generated successfully with company logo!");
          } else {
            toast.success("Document generated successfully!");
          }
        } catch (renderError) {
          console.error("Error rendering document:", renderError);
          toast.error("Error generating document. Please try again.");
        }
      });
    } catch (mainError) {
      console.error("Main error in generatePDF:", mainError);
      toast.error("Failed to generate document. Please try again.");
    }
  };

  // Function to submit the title and the image of the dialog
  function onSubmitQuoteTitleButton() {
    if (quotationTitle !== "") {
      generatePDF();
      setQuotationTitle("");
      setCompanyLogoImage(null);
      setCompanyLogoFile(null);
      setImagePreview(null);
      setImageError("");
      setQuotationTitleDialog(false);
    } else {
      toast.warning("Please enter the quotation title");
    }
  }

  // Function to clear the title and the image of the dialog. And to close the dialog
  function handleCancelBtnIsClicked() {
    setQuotationTitle("");
    setCompanyLogoImage(null);
    setCompanyLogoFile(null);
    setImagePreview(null);
    setImageError("");
    setQuotationTitleDialog(false);
  }

  const [modules, setModules] = useState([]);

  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/getItemsoftModules/`)
      .then((result) => {
        let newModules = {};
        result.data.forEach((e) => {
          newModules[e.id] = e.module_name + " - " + e.module_description;
        });
        setModules(newModules);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${serverBaseAddress}/api/quotation/` + id)
      .then((result) => {
        setToCompanyName(result.data[0].company_name);
        setToCompanyAddress(result.data[0].company_address);
        setKindAttention(result.data[0].kind_attention);
        setCustomerEmail(result.data[0].customer_email);
        setCustomerContactNumber(result.data[0].customer_contact_number);
        setSelectedQuotationId(result.data[0].quotation_ids);
        setCustomerIdStr(result.data[0].customer_id);
        setQuoteGivenDate(
          moment(result.data[0].quote_given_date).format("DD-MM-YYYY")
        );
        setCustomerReferance(result.data[0].customer_referance);
        setTableData(JSON.parse(result.data[0].tests));
        setQuoteCategory(result.data[0].quote_category);
        setQuoteVersion(
          result.data[0].quote_version ? result.data[0].quote_version : ""
        );
        setTaxableAmount(result.data[0].total_amount);
        setTotalAmountInWords(result.data[0].total_taxable_amount_in_words);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [id]);

  return (
    <>
      {quotationTitleDialog && (
        <Dialog
          open={quotationTitleDialog}
          onClose={handleCancelBtnIsClicked}
          aria-labelledby="quotation_title-dialog"
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            },
          }}
        >
          <DialogTitle
            id="quotation_title-dialog"
            sx={{
              background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
              color: "white",
              textAlign: "center",
              fontSize: "1.3rem",
              fontWeight: 600,
            }}
          >
            📄 Generate Quotation Document
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Quotation Title Input */}
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "#1976d2", fontWeight: 600 }}
                >
                  📋 Quotation Details
                </Typography>
                <TextField
                  value={quotationTitle}
                  onChange={(e) =>
                    setQuotationTitle(e.target.value.toUpperCase())
                  }
                  label="Quotation Title"
                  placeholder="Enter quotation title..."
                  fullWidth
                  variant="outlined"
                  autoComplete="on"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "borderRadius": 2,
                      "&:hover fieldset": {
                        borderColor: "#1976d2",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#1976d2",
                    },
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Company Logo Section */}
              <Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: "#1976d2", fontWeight: 600 }}
                >
                  🖼️ Company Logo (Optional)
                </Typography>

                {/* Image Upload Area */}
                {!imagePreview ? (
                  <Card
                    sx={{
                      "border": `2px dashed ${
                        dragActive ? "#1976d2" : "#e0e0e0"
                      }`,
                      "borderRadius": 3,
                      "p": 3,
                      "textAlign": "center",
                      "backgroundColor": dragActive ? "#e3f2fd" : "#fafafa",
                      "cursor": "pointer",
                      "transition": "all 0.3s ease",
                      "&:hover": {
                        borderColor: "#1976d2",
                        backgroundColor: "#e3f2fd",
                      },
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <CloudUpload
                      sx={{ fontSize: 48, color: "#1976d2", mb: 2 }}
                    />
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: "#1976d2" }}
                    >
                      Upload Company Logo
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 2 }}
                    >
                      Drag & drop your logo here or click to browse
                    </Typography>
                    <Chip
                      label="JPG, PNG, GIF, WebP (Max 5MB)"
                      size="small"
                      sx={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}
                    />

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </Card>
                ) : (
                  /* Image Preview */
                  <Card
                    elevation={4}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      background:
                        "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircle
                            sx={{ color: "#4caf50", fontSize: 20 }}
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, color: "#4caf50" }}
                          >
                            Logo Ready
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={removeImage}
                          size="small"
                          sx={{
                            "color": "#f44336",
                            "&:hover": { backgroundColor: "#ffebee" },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>

                      <Box
                        display="flex"
                        justifyContent="center"
                        mb={2}
                        sx={{
                          p: 2,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 2,
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt="Company Logo Preview"
                          style={{
                            maxWidth: "200px",
                            maxHeight: "100px",
                            objectFit: "contain",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ textAlign: "center", display: "block" }}
                      >
                        This logo will be embedded in your quotation document
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Error Display */}
                {imageError && (
                  <Alert
                    severity="error"
                    sx={{ mt: 2, borderRadius: 2 }}
                    icon={<ErrorOutline />}
                  >
                    {imageError}
                  </Alert>
                )}
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 3, backgroundColor: "#f8f9fa" }}>
            <Button
              variant="outlined"
              onClick={handleCancelBtnIsClicked}
              sx={{
                "borderRadius": 2,
                "px": 3,
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onSubmitQuoteTitleButton}
              disabled={!quotationTitle.trim()}
              startIcon={<PictureAsPdf />}
              sx={{
                "borderRadius": 2,
                "px": 4,
                "background":
                  "linear-gradient(45deg, #1976d2 30%, #1565c0 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1565c0 30%, #0d47a1 90%)",
                },
                "&:disabled": {
                  background: "#cccccc",
                },
              }}
            >
              Generate Document
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
