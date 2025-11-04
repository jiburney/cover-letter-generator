import React, { useState, useEffect } from 'react';
import './App.css'; // We'll create this CSS file

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
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('generate');
  
  // New state for Story Bank and Job Analysis
  const [stories, setStories] = useState([]);
  const [jobAnalysis, setJobAnalysis] = useState({
    keyRequirements: '',
    companyValues: '',
    specificInterests: '',
    relevantStories: []
  });

  // Load saved data on component mount
  useEffect(() => {
    // Initialize with empty data - you could add localStorage here if needed
    setSavedLetters([]);
    setStories([]);
  }, []);

  // Show feedback with auto-hide
  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

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
      showFeedback('Resume uploaded successfully!');
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
          showFeedback(`${files.length} cover letter(s) uploaded successfully!`);
        }
      };
      reader.readAsText(file);
    });
  };
  
  // Save API key
  const saveApiKey = () => {
    showFeedback('API key saved successfully!');
  };

  // Add new story
  const addStory = () => {
    const newStory = {
      id: Date.now(),
      title: '',
      category: '',
      content: '',
      skills: []
    };
    setStories([...stories, newStory]);
  };

  // Update story
  const updateStory = (id, field, value) => {
    setStories(stories.map(story => {
      if (story.id === id) {
        if (field === 'skills') {
          return { ...story, [field]: value.split(',').map(s => s.trim()).filter(s => s) };
        }
        return { ...story, [field]: value };
      }
      return story;
    }));
  };

  // Delete story
  const deleteStory = (id) => {
    setStories(stories.filter(story => story.id !== id));
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      showFeedback('Please enter a job description');
      return;
    }
    
    if (!apiKey.trim()) {
      showFeedback('Please enter an API key in the Settings tab');
      return;
    }
    
    setIsGenerating(true);
    showFeedback('Generating your cover letter...');
    
    try {
      const prompt = createPromptForAI();
      const response = await callAIApi(prompt);
      
      setCoverLetter(response);
      setIsGenerating(false);
      showFeedback('Cover letter generated! Feel free to edit before saving.');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setIsGenerating(false);
      showFeedback(`Error: ${error.message || 'Failed to generate cover letter'}`);
    }
  };
  
  // Create AI prompt
  const createPromptForAI = () => {
    let prompt = `Please write a professional cover letter for the following job description:\n\n${jobDescription}\n\n`;
    
    if (resume) {
      prompt += `Use the following resume information to personalize the letter:\n\n${resume}\n\n`;
    }
    
    if (linkedinProfile) {
      prompt += `Additional professional information from LinkedIn:\n\n${linkedinProfile}\n\n`;
    }

    // Add job analysis context
    if (jobAnalysis.keyRequirements || jobAnalysis.companyValues || jobAnalysis.specificInterests) {
      prompt += `Job Analysis Context:\n`;
      if (jobAnalysis.keyRequirements) prompt += `Key Requirements: ${jobAnalysis.keyRequirements}\n`;
      if (jobAnalysis.companyValues) prompt += `Company Values: ${jobAnalysis.companyValues}\n`;
      if (jobAnalysis.specificInterests) prompt += `What excites me about this role: ${jobAnalysis.specificInterests}\n\n`;
    }

    // Add relevant stories
    if (jobAnalysis.relevantStories.length > 0) {
      prompt += `Relevant background stories to incorporate:\n`;
      jobAnalysis.relevantStories.forEach(storyId => {
        const story = stories.find(s => s.id === parseInt(storyId));
        if (story) {
          prompt += `${story.title} (${story.category}): ${story.content}\n\n`;
        }
      });
    }
    
    if (previousCoverLetters.length > 0) {
      prompt += `Here are examples of my previous cover letters for reference (match my style and tone):\n\n`;
      previousCoverLetters.forEach(letter => {
        prompt += `${letter.content}\n\n---\n\n`;
      });
    }
    
    // Enhanced instructions for the AI
    prompt += `Instructions:
    1. Write a compelling, professional cover letter that highlights my relevant skills and experience for this specific job.
    2. Use the job analysis context to focus on what matters most to this employer.
    3. Incorporate the relevant stories naturally - don't force them if they don't fit well.
    4. Keep the letter concise, around 300-400 words.
    5. Match the tone to my previous cover letters if provided.
    6. Include a personalized introduction that shows understanding of the company and role.
    7. Format with proper business letter structure including date and greeting.
    8. Structure as: Hook + Experience Connection + Unique Differentiator + Strategic Thinking + Enthusiastic Close`;
    
    return prompt;
  };
  
  // Call AI API
  const callAIApi = async (prompt) => {
    try {
      const response = await fetch('http://localhost:3001/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          apiKey: apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }
      
      const data = await response.json();
      return data.content;
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
      date: new Date().toISOString(),
      jobAnalysis: jobAnalysis
    };
    
    const updatedLetters = [...savedLetters, newSavedLetter];
    setSavedLetters(updatedLetters);
    
    showFeedback('Cover letter saved! This data will help improve future drafts.');
    
    // Reset form
    setTimeout(() => {
      setJobDescription('');
      setCoverLetter('');
      setFinalCoverLetter('');
      setFileContent('');
      setJobAnalysis({
        keyRequirements: '',
        companyValues: '',
        specificInterests: '',
        relevantStories: []
      });
    }, 2000);
  };
  
  // Delete a saved letter
  const deleteSavedLetter = (id) => {
    const updatedLetters = savedLetters.filter(letter => letter.id !== id);
    setSavedLetters(updatedLetters);
  };
  
  // Delete a previous cover letter
  const deletePreviousCoverLetter = (id) => {
    const updatedLetters = previousCoverLetters.filter(letter => letter.id !== id);
    setPreviousCoverLetters(updatedLetters);
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

  // Generate PDF
  const generatePDF = () => {
    const content = finalCoverLetter || coverLetter;
    if (!content.trim()) {
      showFeedback('No cover letter content to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              max-width: 8.5in;
              margin: 1in auto;
              padding: 0;
              font-size: 12pt;
            }
            .content {
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="content">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>Cover Letter Generator</h1>
          <p>Create personalized cover letters with AI assistance</p>
        </div>
        
        {/* Navigation */}
        <div className="nav">
          {[
            { id: 'generate', label: 'Generate' },
            { id: 'analysis', label: 'Job Analysis' },
            { id: 'stories', label: 'Story Bank' },
            { id: 'profile', label: 'Profile' },
            { id: 'previous', label: 'Previous Letters' },
            { id: 'settings', label: 'Settings' }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Feedback */}
        {feedback && (
          <div className="feedback">
            {feedback}
          </div>
        )}
        
        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>Job Description</h2>
              
              <div className="upload-area" onClick={() => document.getElementById('job-file').click()}>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p>{fileContent ? 'File uploaded - Click to change' : 'Upload job description'}</p>
              </div>
              <input 
                type="file" 
                id="job-file"
                style={{display: 'none'}}
                onChange={handleFileUpload} 
                accept=".txt,.pdf,.doc,.docx" 
              />
              
              <textarea
                className="form-textarea"
                style={{height: '12rem'}}
                placeholder="Or paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              
              <div className="btn-center">
                <button
                  className="btn btn-primary"
                  onClick={generateCoverLetter}
                  disabled={isGenerating || !jobDescription.trim()}
                >
                  {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
                </button>
              </div>
            </div>
            
            {coverLetter && (
              <div className="content-card">
                <h2>Your Cover Letter</h2>
                
                <textarea
                  className="form-textarea"
                  style={{height: '24rem'}}
                  value={finalCoverLetter || coverLetter}
                  onChange={(e) => setFinalCoverLetter(e.target.value)}
                />
                
                <div className="btn-center">
                  <button className="btn btn-success" onClick={saveFinalVersion}>
                    Save Letter
                  </button>
                  <button className="btn btn-secondary" onClick={exportCoverLetter}>
                    Export Text
                  </button>
                  <button className="btn btn-danger" onClick={generatePDF}>
                    Export PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>Job Analysis</h2>
              <p>Analyze the job and company to create a more targeted cover letter</p>
              
              <div className="form-group">
                <label className="form-label">Key Requirements (skills, experience, qualifications)</label>
                <textarea
                  className="form-textarea"
                  placeholder="List the most important requirements for this role..."
                  value={jobAnalysis.keyRequirements}
                  onChange={(e) => setJobAnalysis({...jobAnalysis, keyRequirements: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company Values & Mission</label>
                <textarea
                  className="form-textarea"
                  placeholder="What does this company care about? What's their mission?"
                  value={jobAnalysis.companyValues}
                  onChange={(e) => setJobAnalysis({...jobAnalysis, companyValues: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">What Excites You About This Role</label>
                <textarea
                  className="form-textarea"
                  placeholder="Be specific about what interests you about this particular job..."
                  value={jobAnalysis.specificInterests}
                  onChange={(e) => setJobAnalysis({...jobAnalysis, specificInterests: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relevant Stories from Your Story Bank</label>
                <div className="story-checkboxes">
                  {stories.map(story => (
                    <div key={story.id} className="checkbox-group">
                      <input
                        type="checkbox"
                        id={`story-${story.id}`}
                        checked={jobAnalysis.relevantStories.includes(story.id.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setJobAnalysis({
                              ...jobAnalysis,
                              relevantStories: [...jobAnalysis.relevantStories, story.id.toString()]
                            });
                          } else {
                            setJobAnalysis({
                              ...jobAnalysis,
                              relevantStories: jobAnalysis.relevantStories.filter(id => id !== story.id.toString())
                            });
                          }
                        }}
                      />
                      <label htmlFor={`story-${story.id}`}>
                        {story.title || 'Untitled Story'} ({story.category})
                      </label>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <p className="empty-text">No stories in your Story Bank yet. Add some in the Story Bank tab!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Story Bank Tab */}
        {activeTab === 'stories' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>Story Bank</h2>
              <p>Pre-write stories about your experiences to easily incorporate into cover letters</p>
              
              <div className="btn-center">
                <button className="btn btn-primary" onClick={addStory}>
                  Add New Story
                </button>
              </div>

              <div className="stories-container">
                {stories.map(story => (
                  <div key={story.id} className="story-item">
                    <div className="story-grid">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Story title (e.g., 'Appalachian Trail Leadership')"
                        value={story.title}
                        onChange={(e) => updateStory(story.id, 'title', e.target.value)}
                      />
                      <select
                        className="form-input"
                        value={story.category}
                        onChange={(e) => updateStory(story.id, 'category', e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Problem Solving">Problem Solving</option>
                        <option value="Persistence/Grit">Persistence/Grit</option>
                        <option value="Climate/Sustainability">Climate/Sustainability</option>
                        <option value="Product Thinking">Product Thinking</option>
                        <option value="Teamwork">Teamwork</option>
                        <option value="Innovation">Innovation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <textarea
                      className="form-textarea story-content"
                      placeholder="Write your story here... Focus on specific actions, results, and what you learned."
                      value={story.content}
                      onChange={(e) => updateStory(story.id, 'content', e.target.value)}
                    />
                    
                    <div className="story-actions">
                      <input
                        type="text"
                        className="form-input skills-input"
                        placeholder="Skills demonstrated (comma-separated)"
                        value={story.skills.join(', ')}
                        onChange={(e) => updateStory(story.id, 'skills', e.target.value)}
                      />
                      <button
                        className="link-button danger"
                        onClick={() => deleteStory(story.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {stories.length === 0 && (
                  <div className="empty-state">
                    <p>No stories yet! Start building your story bank.</p>
                    <p>Examples: AT hike experiences, climate projects, product insights, professional achievements</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>Resume</h2>
              
              <div className="upload-area" onClick={() => document.getElementById('resume-file').click()}>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p>{resume ? 'Resume uploaded - Click to update' : 'Upload your resume'}</p>
              </div>
              <input 
                type="file" 
                id="resume-file"
                style={{display: 'none'}}
                onChange={handleResumeUpload} 
                accept=".txt,.pdf,.doc,.docx" 
              />
              
              {resume && (
                <textarea
                  className="form-textarea"
                  style={{height: '12rem'}}
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                />
              )}
            </div>
            
            <div className="content-card">
              <h2>LinkedIn Profile</h2>
              <textarea
                className="form-textarea"
                style={{height: '8rem'}}
                placeholder="Add your LinkedIn profile information or URL here..."
                value={linkedinProfile}
                onChange={(e) => setLinkedinProfile(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {/* Previous Letters Tab */}
        {activeTab === 'previous' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>Previous Cover Letters</h2>
              <p>Upload examples to help AI match your writing style</p>
              
              <div className="upload-area" onClick={() => document.getElementById('previous-files').click()}>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p>Upload previous cover letters (multiple files allowed)</p>
              </div>
              <input 
                type="file" 
                id="previous-files"
                style={{display: 'none'}}
                onChange={handlePreviousCoverLetterUpload} 
                accept=".txt,.pdf,.doc,.docx" 
                multiple 
              />
              
              <div className="letters-container">
                {previousCoverLetters.map(letter => (
                  <div key={letter.id} className="saved-letter">
                    <div className="saved-letter-header">
                      <h4>{letter.name}</h4>
                      <div>
                        <button
                          className="link-button"
                          onClick={() => loadPreviousCoverLetter(letter.id)}
                        >
                          Use as Template
                        </button>
                        <button
                          className="link-button danger"
                          onClick={() => deletePreviousCoverLetter(letter.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="saved-letter-text">
                      {letter.content.substring(0, 150)}...
                    </p>
                  </div>
                ))}
                
                {previousCoverLetters.length === 0 && (
                  <div className="empty-state">
                    No previous cover letters uploaded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="content-card">
              <h2>API Settings</h2>
              
              <div className="form-group">
                <label className="form-label">Claude API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                
                <div className="btn-center">
                  <button className="btn btn-primary" onClick={saveApiKey}>
                    Save API Key
                  </button>
                </div>
              </div>
              
              <div className="info-box">
                <h4>API Information</h4>
                <p>
                  This application uses the Claude API from Anthropic. You'll need to create an account 
                  at <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a> and
                  create an API key.
                </p>
                <p>
                  Your API key is stored locally in your browser and is only sent to 
                  Anthropic's API when generating cover letters.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Saved Letters */}
        {activeTab === 'generate' && savedLetters.length > 0 && (
          <div className="content-card">
            <h2>Your Saved Cover Letters</h2>
            
            <div className="letters-container">
              {savedLetters.map(letter => (
                <div key={letter.id} className="saved-letter">
                  <div className="saved-letter-header">
                    <span className="saved-letter-date">
                      {new Date(letter.date).toLocaleDateString()}
                    </span>
                    <button
                      className="link-button danger"
                      onClick={() => deleteSavedLetter(letter.id)}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="saved-letter-text">
                    {letter.jobDescription.substring(0, 120)}...
                  </p>
                  <button
                    className="link-button"
                    onClick={() => {
                      setCoverLetter(letter.final);
                      setFinalCoverLetter(letter.final);
                      if (letter.jobAnalysis) {
                        setJobAnalysis(letter.jobAnalysis);
                      }
                    }}
                  >
                    Load Letter & Analysis
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterGenerator;