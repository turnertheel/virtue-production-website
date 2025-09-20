document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileListContainer = document.getElementById('fileList');

    const workerBaseUrl = 'https://virtue-production-backend.virtueproductionco.workers.dev';

    // --- File Upload Logic ---
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const file = fileInput.files[0];
            if (!file) {
                showStatus('Please select a file to upload.', 'error');
                return;
            }

            showStatus('Uploading...', 'info');

            try {
                // IMPORTANT: Use your actual worker URL. This is a placeholder.
                const response = await fetch(`${workerBaseUrl}/upload`, {
                    method: 'POST',
                    headers: {
                        'X-File-Name': file.name
                    },
                    body: file
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Unknown error occurred.');
                }

                showStatus(result.message, 'success');
                fileInput.value = ''; // Reset file input
                await loadFiles(); // Refresh the file list

            } catch (error) {
                console.error('Upload failed:', error);
                showStatus(`Upload failed: ${error.message}`, 'error');
            }
        });
    }

    function showStatus(message, type) {
        uploadStatus.innerHTML = `<p class="status-${type}">${message}</p>`;
    }

    // --- File List Logic ---
    async function loadFiles() {
        if (!fileListContainer) return;
        fileListContainer.innerHTML = '<p class="text-gray-500">Loading files...</p>';

        try {
            const response = await fetch(`${workerBaseUrl}/list-files`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to fetch files.');
            }

            if (result.files.length === 0) {
                fileListContainer.innerHTML = '<p class="text-gray-500">No files have been uploaded yet.</p>';
                return;
            }

            // Clear container and render file list
            fileListContainer.innerHTML = '';
            result.files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-md border';
                
                const fileInfo = document.createElement('div');
                const fileName = document.createElement('p');
                fileName.className = 'font-semibold text-gray-800';
                fileName.textContent = file.key;

                const fileDate = document.createElement('p');
                fileDate.className = 'text-sm text-gray-500';
                fileDate.textContent = `Uploaded on: ${new Date(file.uploaded).toLocaleDateString()}`;
                
                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileDate);

                const copyButton = document.createElement('button');
                copyButton.className = 'px-4 py-1.5 text-sm rounded-md btn-secondary uppercase font-bold';
                copyButton.textContent = 'Copy Link';
                copyButton.onclick = () => copyToClipboard(file.url, copyButton);
                
                fileElement.appendChild(fileInfo);
                fileElement.appendChild(copyButton);
                fileListContainer.appendChild(fileElement);
            });

        } catch (error) {
            console.error('Failed to load files:', error);
            fileListContainer.innerHTML = `<p class="status-error">Could not load files: ${error.message}</p>`;
        }
    }

    function copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showStatus('Failed to copy link.', 'error');
        });
    }

    // Initial load of files when the page is ready
    loadFiles();
});

