import React from 'react'
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";


export default function DocumentViewer() {

    const docs = [
        {
            uri: "https://calibre-ebook.com/downloads/demos/demo.docx",

            fileType: 'docx',
            //fileName: 'demo.docx'
        },

    ];

    return (
        <div>
            <h1>Documents Demo</h1>
            <DocViewer documents={docs} pluginRenderers={DocViewerRenderers}
                style={{ height: 1000 }}
            />
        </div>


    )
}
