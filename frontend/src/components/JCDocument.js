
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import { saveAs } from 'file-saver';
import JCTemplate from '../templates/JobcardTemplate.docx';

function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

export const generateJcDocument = (jobCardData) => {

  console.log('jobCardData', jobCardData)

  loadFile(JCTemplate, function (error, content) {
    if (error) {
      throw error;
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.setData(jobCardData);

    try {
      doc.render();
    } catch (error) {
      console.error('Docxtemplater render error:', error);
    }

    const blob = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const fileName = `JC_${jobCardData.jcNumber}.docx`;
    saveAs(blob, fileName);
  });
};





