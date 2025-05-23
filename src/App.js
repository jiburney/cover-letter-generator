import React, { useState, useEffect } from 'react';
import { Upload, FileText, Settings, User, History } from 'lucide-react';

const CoverLetterGenerator = () => {
  // State variables
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [finalCoverLetter, setFinalCoverLetter] = useState('');
  const [savedLetters, setSavedLetters] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [resume, setResume] = useState('');
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [previousCoverLetters, setPreviousCoverLetters] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('aiApiKey') || '');
  const [activeTab, setActiveTab] = useState('generate');

  // Load saved data from localStorage on component mount
  useEffect(() => {
    // Load saved cover letters
    const savedData = localStorage.getItem('savedCoverLetters');
    if (savedData) {
      setSavedLetters(JSON.parse(savedData));
    }
    
    // Load resume
    const savedResume = localStorage.getItem('resume');
    if (savedResume) {
      setResume(savedResume);
    }
    
    // Load LinkedIn profile
    const savedLinkedin = localStorage.getItem('linkedinProfile');
    if (savedLinkedin) {
      setLinkedinProfile(savedLinkedin);
    }
    
    // Load previous cover letters
    const savedPreviousLetters = localStorage.getItem('previousCoverLetters');
    if (savedPreviousLetters) {
      setPreviousCoverLetters(JSON.parse(savedPreviousLetters));
    }
  }, []);

  // Handle file upload for job description
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setJobDescription(content);
      setFileContent(content);
    };
    reader.readAsText(file);
  };
  
  // Handle file upload for resume
  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setResume(content);
      localStorage.setItem('resume', content);
      setFeedback('Resume uploaded successfully!');
      setTimeout(() => setFeedback(''), 2000);
    };
    reader.readAsText(file);
  };
  
  // Handle file upload for previous cover letters
  const handlePreviousCoverLetterUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newLetters = [...previousCoverLetters];
    let filesProcessed = 0;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        newLetters.push({
          id: Date.now() + filesProcessed,
          name: file.name,
          content: content
        });
        
        filesProcessed++;
        
        if (filesProcessed === files.length) {
          setPreviousCoverLetters(newLetters);
          localStorage.setItem('previousCoverLetters', JSON.stringify(newLetters));
          setFeedback(`${files.length} cover letter(s) uploaded successfully!`);
          setTimeout(() => setFeedback(''), 2000);
        }
      };
      reader.readAsText(file);
    });
  };
  
  // Save API key
  const saveApiKey = () => {
    localStorage.setItem('aiApiKey', apiKey);
    setFeedback('API key saved successfully!');
    setTimeout(() => setFeedback(''), 2000);
  };
  
  // Generate cover letter based on job description and user profile
  const generateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      setFeedback('Please enter a job description');
      return;
    }
    
    if (!apiKey.trim()) {
      setFeedback('Please enter an API key in the Settings tab');
      return;
    }
    
    setIsGenerating(true);
    setFeedback('Generating your cover letter...');
    
    try {
      // Prepare the data for the API request
      const prompt = createPromptForAI();
      
      // Make API request to Claude or another AI service
      const response = await callAIApi(prompt);
      
      setCoverLetter(response);
      setIsGenerating(false);
      setFeedback('Cover letter generated! Feel free to edit before saving.');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setIsGenerating(false);
      setFeedback(`Error: ${error.message || 'Failed to generate cover letter'}`);
    }
  };
  
  // Create a prompt for the AI
  const createPromptForAI = () => {
    let prompt = `Please write a professional cover letter for the following job description:\n\n${jobDescription}\n\n`;
    
    if (resume) {
      prompt += `Use the following resume information to personalize the letter:\n\n${resume}\n\n`;
    }
    
    if (linkedinProfile) {
      prompt += `Additional professional information from LinkedIn:\n\n${linkedinProfile}\n\n`;
    }
    
    if (previousCoverLetters.length > 0) {
      prompt += `Here are examples of my previous cover letters for reference (match my style and tone):\n\n`;
      previousCoverLetters.forEach(letter => {
        prompt += `${letter.content}\n\n---\n\n`;
      });
    }
    
    // Add instructions for the AI
    prompt += `Instructions:
    1. Write a compelling, professional cover letter that highlights my relevant skills and experience for this specific job.
    2. Keep the letter concise, around 300-400 words.
    3. Match the tone to my previous cover letters if provided.
    4. Include a personalized introduction that shows understanding of the company and role.
    5. Format with proper business letter structure including date and greeting.`;
    
    return prompt;
  };
  
  // Call the AI API
  const callAIApi = async (prompt) => {
    // This example uses Claude API, but you can replace with any AI API
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
      }
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw error;
    }
  };
  
  // Save final version
  const saveFinalVersion = () => {
    if (!finalCoverLetter.trim()) {
      setFinalCoverLetter(coverLetter);
    }
    
    const newSavedLetter = {
      id: Date.now(),
      jobDescription: jobDescription,
      draft: coverLetter,
      final: finalCoverLetter || coverLetter,
      date: new Date().toISOString()
    };
    
    const updatedLetters = [...savedLetters, newSavedLetter];
    setSavedLetters(updatedLetters);
    
    // Save to localStorage
    localStorage.setItem('savedCoverLetters', JSON.stringify(updatedLetters));
    
    setFeedback('Cover letter saved! This data will help improve future drafts.');
    
    // Reset form
    setTimeout(() => {
      setJobDescription('');
      setCoverLetter('');
      setFinalCoverLetter('');
      setFileContent('');
      setFeedback('');
    }, 2000);
  };
  
  // Delete a saved letter
  const deleteSavedLetter = (id) => {
    const updatedLetters = savedLetters.filter(letter => letter.id !== id);
    setSavedLetters(updatedLetters);
    localStorage.setItem('savedCoverLetters', JSON.stringify(updatedLetters));
  };
  
  // Delete a previous cover letter
  const deletePreviousCoverLetter = (id) => {
    const updatedLetters = previousCoverLetters.filter(letter => letter.id !== id);
    setPreviousCoverLetters(updatedLetters);
    localStorage.setItem('previousCoverLetters', JSON.stringify(updatedLetters));
  };
  
  // Use a previous cover letter as the base
  const loadPreviousCoverLetter = (id) => {
    const letter = previousCoverLetters.find(letter => letter.id === id);
    if (letter) {
      setCoverLetter(letter.content);
      setFinalCoverLetter(letter.content);
    }
  };
  
  // Export cover letter as text file
  const exportCoverLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([finalCoverLetter || coverLetter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Cover Letter Generator</h1>
      
      <div className="mb-6 flex border-b">
        <button 
          className={`py-2 px-4 ${activeTab === 'generate' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Letter
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('profile')}
        >
          My Profile
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'previous' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('previous')}
        >
          Previous Letters
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {feedback && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
          {feedback}
        </div>
      )}
      
      {activeTab === 'generate' && (
        <>
          <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Step 1: Enter Job Description</h2>
            
            <div className="flex flex-col space-y-4">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {fileContent ? 'File uploaded' : 'Upload job description or paste below'}
                  </p>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.pdf,.doc,.docx" />
              </label>
              
              <textarea
                className="w-full h-48 p-3 border border-gray-300 rounded-lg"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
              
              <button
                className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                onClick={generateCoverLetter}
                disabled={isGenerating || !jobDescription.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
          </div>
          
          {coverLetter && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Step 2: Edit Draft Cover Letter</h2>
              
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-lg mb-4"
                value={finalCoverLetter || coverLetter}
                onChange={(e) => setFinalCoverLetter(e.target.value)}
              ></textarea>
              
              <div className="flex space-x-4">
                <button
                  className="py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                  onClick={saveFinalVersion}
                >
                  Save Final Version
                </button>
                <button
                  className="py-2 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
                  onClick={exportCoverLetter}
                >
                  Export as Text
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'profile' && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">My Professional Profile</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Resume</h3>
            <p className="text-sm text-gray-600 mb-2">Upload your resume to help personalize your cover letters</p>
            
            <div className="flex flex-col space-y-4">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                <div className="text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {resume ? 'Resume uploaded - Click to update' : 'Upload your resume'}
                  </p>
                </div>
                <input type="file" className="hidden" onChange={handleResumeUpload} accept=".txt,.pdf,.doc,.docx" />
              </label>
              
              {resume && (
                <textarea
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg"
                  value={resume}
                  onChange={(e) => {
                    setResume(e.target.value);
                    localStorage.setItem('resume', e.target.value);
                  }}
                ></textarea>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">LinkedIn Profile</h3>
            <p className="text-sm text-gray-600 mb-2">Add your LinkedIn profile information for additional context</p>
            
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg"
              placeholder="Paste LinkedIn profile information or URL here..."
              value={linkedinProfile}
              onChange={(e) => {
                setLinkedinProfile(e.target.value);
                localStorage.setItem('linkedinProfile', e.target.value);
              }}
            ></textarea>
          </div>
        </div>
      )}
      
      {activeTab === 'previous' && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Previous Cover Letters</h2>
          <p className="text-sm text-gray-600 mb-4">Upload examples of your previous cover letters to help the AI match your style and tone</p>
          
          <div className="flex flex-col space-y-4 mb-6">
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
              <div className="text-center">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Upload previous cover letters (you can select multiple files)
                </p>
              </div>
              <input type="file" className="hidden" onChange={handlePreviousCoverLetterUpload} accept=".txt,.pdf,.doc,.docx" multiple />
            </label>
          </div>
          
          {previousCoverLetters.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium mb-2">Uploaded Cover Letters</h3>
              
              {previousCoverLetters.map(letter => (
                <div key={letter.id} className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium">{letter.name}</p>
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => loadPreviousCoverLetter(letter.id)}
                      >
                        Use as Template
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm"
                        onClick={() => deletePreviousCoverLetter(letter.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm line-clamp-2">
                    {letter.content.substring(0, 120)}...
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {previousCoverLetters.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No previous cover letters uploaded yet.
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">API Settings</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">AI API Key</h3>
            <p className="text-sm text-gray-600 mb-2">Enter your API key to connect to the AI service</p>
            
            <div className="flex flex-col space-y-4">
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              
              <button
                className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 w-40"
                onClick={saveApiKey}
              >
                Save API Key
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h4 className="text-md font-medium mb-2">API Information</h4>
              <p className="text-sm text-gray-600">
                This application uses the Claude API from Anthropic. You'll need to sign up for an account 
                at <a href="https://console.anthropic.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">console.anthropic.com</a> and
                create an API key.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Your API key is stored locally in your browser and is not sent to any server except for 
                Anthropic's API when generating cover letters.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'generate' && savedLetters.length > 0 && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Generated Cover Letters</h2>
          
          <div className="space-y-4">
            {savedLetters.map(letter => (
              <div key={letter.id} className="p-4 border border-gray-300 rounded-lg">
                <div className="flex justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    {new Date(letter.date).toLocaleDateString()}
                  </p>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => deleteSavedLetter(letter.id)}
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-800 mb-2 line-clamp-2">
                  {letter.jobDescription.substring(0, 100)}...
                </p>
                <div className="flex space-x-2">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setCoverLetter(letter.final);
                      setFinalCoverLetter(letter.final);
                    }}
                  >
                    View Full Letter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverLetterGenerator;