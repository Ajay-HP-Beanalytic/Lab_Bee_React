import React from 'react'
import Docxtemplater from 'docxtemplater'
import { saveAs } from 'file-saver';


import JCTemplate from '../templates/JobcardTemplate.docx'

import PizZip from 'pizzip';
import PizZipUtils from 'pizzip/utils/index.js';
import axios from 'axios';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';


function loadFile(url, callback) {
  PizZipUtils.getBinaryContent(url, callback);
}

export default function JCDocument({ jcNumber }) {
  return (
    <div>JCDocument</div>
  )
}
