// Create and initialize popup elements
let popupContainer = null;
let isPopupVisible = false;
let lernenButton = null;

// Debug logging function
function log(message, data = null) {
  const logMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.log(`[RussianTranslator] ${logMsg}`);
}

// Error logging function
function logError(message, error) {
  console.error(`[RussianTranslator] ERROR - ${message}:`, error);
}

// Function to get the full sentence containing the selected text
function getFullSentence(selection) {
  if (!selection.rangeCount) return '';
  
  const range = selection.getRangeAt(0);
  const text = range.toString().trim();
  
  // Get the text node containing the selection
  let node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) {
    // If the selection is in an element, find the text node
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    node = walker.nextNode();
  }
  
  if (!node) return text;
  
  // Get the full text content
  let fullText = node.textContent;
  
  // Find the sentence boundaries
  const sentenceStart = Math.max(0, fullText.lastIndexOf('.', range.startOffset) + 1);
  const sentenceEnd = Math.min(
    fullText.length,
    fullText.indexOf('.', range.endOffset) + 1 || fullText.length
  );
  
  // Extract the sentence
  let sentence = fullText.substring(sentenceStart, sentenceEnd).trim();
  
  // If the sentence is too short, try to get more context
  if (sentence.length < 20) {
    // Try to get the parent element's text
    const parent = node.parentElement;
    if (parent) {
      const parentText = parent.textContent.trim();
      if (parentText.length > sentence.length) {
        sentence = parentText;
      }
    }
  }
  
  return sentence;
}

function createPopup() {
  // Create popup container if it doesn't exist
  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.className = 'russian-translator-popup';
    
    // Add styles to the popup container
    popupContainer.style.cssText = `
      position: absolute;
      width: 350px;
      max-height: 450px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 3px 15px rgba(0, 0, 0, 0.25);
      z-index: 2147483647;
      padding: 18px;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      overflow-y: auto;
      display: none;
      border: 1px solid #e0e0e0;
    `;
    
    document.body.appendChild(popupContainer);
    log('Popup container created');
  }
  
  return popupContainer;
}

// Show loading state in popup
function showLoadingState(text, context) {
  const popup = createPopup();
  
  popup.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="font-weight: bold; margin-bottom: 12px; color: #333; font-size: 15px;">
        Looking up: "${text}"
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 12px; text-align: center;">
        Context: "${context.substring(0, 100)}${context.length > 100 ? '...' : ''}"
      </div>
      <div class="loading-spinner" style="width: 36px; height: 36px; border: 3px solid #f3f3f3; 
        border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  
  positionPopupNearSelection();
  popup.style.display = 'block';
  isPopupVisible = true;
  log('Showing loading state', { text, contextLength: context.length });
}

// Show results in popup
function showResultInPopup(data) {
  log('Showing result in popup', { success: data.success });
  const popup = createPopup();
  
  if (!data.success) {
    popup.innerHTML = `
      <div style="color: #e74c3c; padding: 12px; background-color: #fdf3f2; border-radius: 6px; margin-bottom: 12px;">
        <div style="font-weight: bold; margin-bottom: 5px; font-size: 15px;">Error</div>
        <div>${data.error || 'Unknown error occurred'}</div>
      </div>
      <div style="text-align: right; margin-top: 12px;">
        <button class="close-popup-btn" style="padding: 6px 12px; background: #f0f0f0; border: none; 
        border-radius: 4px; cursor: pointer; font-weight: 500; color: #555;">Close</button>
      </div>
    `;
  } else {
    // Process the definition text to apply styling
    let formattedDefinition = processDefinitionFormatting(data.definition);
    
    popup.innerHTML = `
      <div style="border-bottom: 1px solid #e7e7e7; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="font-weight: bold; font-size: 18px; color: #2c3e50; margin-bottom: 5px;">
          ${data.text}
        </div>
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #333; margin-bottom: 5px;">
        ${formattedDefinition}
      </div>
      <div style="text-align: right; margin-top: 18px; padding-top: 10px; border-top: 1px solid #f0f0f0;">
        <button class="save-to-library-btn" style="padding: 6px 14px; background: #4CAF50; color: white; border: none; 
        border-radius: 4px; cursor: pointer; font-weight: 500; margin-right: 10px; transition: background-color 0.2s;">Save to Library</button>
        <button class="close-popup-btn" style="padding: 6px 14px; background: #f0f0f0; border: none; 
        border-radius: 4px; cursor: pointer; font-weight: 500; color: #555; transition: background-color 0.2s;">Close</button>
      </div>
    `;
  }
  
  // Add event listener to close button
  const closeBtn = popup.querySelector('.close-popup-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', hidePopup);
    closeBtn.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#e0e0e0';
    });
    closeBtn.addEventListener('mouseout', function() {
      this.style.backgroundColor = '#f0f0f0';
    });
  }
  
  // Add event listener to save button
  const saveBtn = popup.querySelector('.save-to-library-btn');
  if (saveBtn && data.success) {
    saveBtn.addEventListener('click', function() {
      saveToLibrary(data.text, data.definition);
      
      // Change button appearance to show success
      this.textContent = 'Saved!';
      this.style.backgroundColor = '#2ecc71';
      
      // Disable the button to prevent multiple saves
      this.disabled = true;
      
      // After 1.5 seconds, restore the button
      setTimeout(() => {
        this.textContent = 'Save to Library';
        this.style.backgroundColor = '#4CAF50';
        this.disabled = false;
      }, 1500);
    });
    
    saveBtn.addEventListener('mouseover', function() {
      if (!this.disabled) {
        this.style.backgroundColor = '#45a049';
      }
    });
    
    saveBtn.addEventListener('mouseout', function() {
      if (!this.disabled) {
        this.style.backgroundColor = '#4CAF50';
      }
    });
  }
  
  positionPopupNearSelection();
  popup.style.display = 'block';
  isPopupVisible = true;
}

// Process and format the definition text with styling
function processDefinitionFormatting(text) {
  if (!text) return '';
  
  // Replace double newlines with proper dividers
  let formatted = text.replace(/\n\n+/g, '<hr style="border: none; border-top: 1px solid #f0f0f0; margin: 12px 0;">');
  
  // Process markdown-style formatting
  formatted = formatted
    // Bold text (between ** or __)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text (between * or _)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks (between `)
    .replace(/`(.*?)`/g, '<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
  
  // Split by lines for individual styling
  let lines = formatted.split('\n');
  let result = [];
  let inExampleBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines but add space
    if (!line) {
      if (inExampleBlock) {
        result.push('<div style="height: 5px;"></div>');
      } else {
        result.push('<div style="height: 8px;"></div>');
      }
      continue;
    }
    
    // Detect different components of the response
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(line);
    const isExampleLine = line.startsWith('Example:');
    
    // Russian translation heading (standalone Cyrillic word or phrase)
    if (hasCyrillic && !isExampleLine && !line.includes('.') && !inExampleBlock) {
      result.push(`<div style="font-weight: bold; color: #2980b9; font-size: 18px; margin-top: 8px; margin-bottom: 6px;">${line}</div>`);
    }
    // Example label line
    else if (isExampleLine) {
      inExampleBlock = true;
      let exampleText = line.replace('Example:', '<span style="color: #555; font-weight: bold;">Example:</span>');
      result.push(`<div style="color: #444; margin-left: 10px; margin-top: 5px;">${exampleText}</div>`);
    }
    // Example sentence (English with quotes, likely follows an "Example:" line)
    else if (inExampleBlock || (line.includes('"') && line.match(/[a-zA-Z]/))) {
      inExampleBlock = line.includes('"'); // Stay in example block if it has quotes
      result.push(`<div style="color: #333; margin-left: 20px; font-style: italic; margin-top: 3px;">${line}</div>`);
    }
    // Any line with Cyrillic inside an English sentence (likely a translation in parentheses)
    else if (hasCyrillic && line.includes('(') && line.includes(')')) {
      result.push(`<div style="color: #2980b9; margin-left: 20px; margin-top: 3px;">${line}</div>`);
      inExampleBlock = false;
    }
    // Regular English content
    else if (line.match(/[a-zA-Z]/)) {
      result.push(`<div style="color: #333; margin-top: 5px;">${line}</div>`);
      inExampleBlock = false;
    }
    // Default formatting for anything else
    else {
      result.push(`<div style="margin-top: 3px;">${line}</div>`);
      inExampleBlock = false;
    }
  }
  
  return result.join('');
}

// Position popup near the selected text
function positionPopupNearSelection() {
  if (!popupContainer) return;
  
  const selection = window.getSelection();
  
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Calculate position
  let top = rect.bottom + window.scrollY + 10; // 10px below selection
  let left = rect.left + window.scrollX;
  
  // Adjust position to keep popup within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popupWidth = 350; // Width defined in CSS
  
  // Adjust horizontally if needed
  if (left + popupWidth > viewportWidth - 20) {
    left = viewportWidth - popupWidth - 20;
  }
  
  // If popup would appear below viewport, position it above the selection
  if (top + 200 > window.scrollY + viewportHeight) {
    top = rect.top + window.scrollY - 10 - popupContainer.offsetHeight;
  }
  
  // Apply position
  popupContainer.style.top = `${top}px`;
  popupContainer.style.left = `${left}px`;
  
  log('Positioned popup', { top, left });
}

// Hide popup
function hidePopup() {
  if (popupContainer) {
    popupContainer.style.display = 'none';
    isPopupVisible = false;
    log('Popup hidden');
  }
}

// Function to save word to library
function saveToLibrary(word, definition) {
  log('Saving word to library', { word, definitionLength: definition.length });
  
  if (!word || !definition) {
    logError('Cannot save word to library', { error: 'Word or definition is empty' });
    return;
  }
  
  // Show visual feedback
  const saveBtn = document.querySelector('.save-to-library-btn');
  if (saveBtn) {
    saveBtn.textContent = 'Saving...';
    saveBtn.style.backgroundColor = '#FFA500'; // Orange while processing
  }
  
  try {
    chrome.runtime.sendMessage({
      action: "saveToLibrary",
      word: word,
      definition: definition
    }, response => {
      log('Received response from saveToLibrary message', response);
      
      // Handle response if available (Chrome MV3 doesn't always return responses)
      if (response) {
        if (response.success) {
          log('Word saved successfully', { word });
          // Update button to show success
          if (saveBtn) {
            saveBtn.textContent = 'Saved!';
            saveBtn.style.backgroundColor = '#2ecc71';
          }
        } else {
          logError('Failed to save word', { error: response.error });
          // Update button to show failure
          if (saveBtn) {
            saveBtn.textContent = 'Failed to Save';
            saveBtn.style.backgroundColor = '#e74c3c';
          }
        }
      }
    });
  } catch (error) {
    logError('Error sending saveToLibrary message', error);
    // Update button to show error
    if (saveBtn) {
      saveBtn.textContent = 'Error';
      saveBtn.style.backgroundColor = '#e74c3c';
    }
  }
}

// Create the Lernen button
function createLernenButton() {
  if (!lernenButton) {
    lernenButton = document.createElement('button');
    lernenButton.textContent = 'Lernen';
    lernenButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      z-index: 2147483646;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    lernenButton.addEventListener('click', showLernenPopup);
    document.body.appendChild(lernenButton);
    log('Lernen button created');
  }
}

// Create and show the Lernen popup
function showLernenPopup() {
  log('Showing Lernen popup');
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    bottom: 70px;
    right: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 2147483647;
    padding: 15px;
    width: 200px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  `;
  
  popup.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <a href="#" id="goToAppLink" style="
        display: block;
        text-align: center;
        padding: 10px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
        font-weight: bold;
      ">Go to the app</a>
      <button id="closeLernenPopup" style="
        margin-top: 10px;
        padding: 5px 10px;
        background: #e0e0e0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Close</button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add event listeners
  document.getElementById('closeLernenPopup').addEventListener('click', () => {
    document.body.removeChild(popup);
    log('Lernen popup closed');
  });
  
  document.getElementById('goToAppLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({action: "openAppPage"});
    document.body.removeChild(popup);
    log('Opening app page');
  });
  
  // Close popup when clicking outside
  document.addEventListener('mousedown', function clickOutside(event) {
    if (!popup.contains(event.target) && event.target !== lernenButton) {
      document.body.removeChild(popup);
      document.removeEventListener('mousedown', clickOutside);
      log('Lernen popup closed by outside click');
    }
  });
}

// Close popup when clicking outside
document.addEventListener('mousedown', (event) => {
  if (isPopupVisible && popupContainer && !popupContainer.contains(event.target)) {
    hidePopup();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Received message', { action: message.action });
  
  if (message.action === 'showLoading') {
    const selection = window.getSelection();
    const context = getFullSentence(selection);
    showLoadingState(message.text, context);
    
    // Send the context back to the background script
    chrome.runtime.sendMessage({
      action: "getDefinition",
      text: message.text,
      context: context
    });
  } else if (message.action === 'showResult') {
    showResultInPopup(message);
  } else if (message.action === 'saveResult') {
    // Could show a toast notification here
    log('Save result', { success: message.success, message: message.message });
  }
  
  return true;
});

// Initialize everything when the content script runs
function initializeExtension() {
  log('Initializing extension');
  createPopup();
  createLernenButton();
}

// Run initialization when the page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
} 