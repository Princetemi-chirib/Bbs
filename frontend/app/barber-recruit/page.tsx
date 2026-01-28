'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function BarberRecruitPageContent() {
  return (
    <>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>Join Our Elite Team</div>
            <h1>Join Our Barber Team</h1>
            <p>Ready to take your barbering career to the next level? Join our prestigious team of master barbers where your skills will be celebrated and your growth unlimited.</p>
            <div className={styles.heroCta}>
              <Link href="#apply" className={styles.btnPrimary}>
                Start Your Journey
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14m-7-7l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="#contact" className={styles.btnSecondary}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Why Join Our Team</div>
            <h2 className={styles.sectionTitle}>Craft Excellence with BBSLimited</h2>
            <p className={styles.sectionSubtitle}>Join an elite community where tradition meets innovation, and every cut is a masterpiece. We're actively recruiting experienced barbers to join our growing team.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <h3>Master Craftsmanship</h3>
              <p>Work alongside legendary barbers with decades of experience. Share your expertise while learning new techniques and perfecting your craft in our supportive, collaborative environment.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11S11 10.1 11 9V7L9 7.5V9C9 11.8 10.4 14.3 12.8 15.5L14 22H16L17.2 15.5C19.6 14.3 21 11.8 21 9Z"/>
                </svg>
              </div>
              <h3>Premium Rewards</h3>
              <p>Earn exceptional compensation with performance bonuses, comprehensive benefits, and unlimited opportunities for professional growth and advancement. Bring your existing clientele and maximize your earning potential with our premium client base.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg width="36" height="36" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M16 4C18.2 4 20 5.8 20 8C20 10.2 18.2 12 16 12C13.8 12 12 10.2 12 8C12 5.8 13.8 4 16 4ZM8 4C10.2 4 12 5.8 12 8C12 10.2 10.2 12 8 12C5.8 12 4 10.2 4 8C4 5.8 5.8 4 8 4ZM8 13C10.67 13 16 14.33 16 17V20H0V17C0 14.33 5.33 13 8 13ZM16 13C18.67 13 24 14.33 24 17V20H18V17C18 15.9 17.33 14.97 16 14.22V13Z"/>
                </svg>
              </div>
              <h3>Elite Brotherhood</h3>
              <p>Join our prestigious team of passionate barbers in an environment that celebrates creativity, excellence, and the timeless craft of barbering. Network with industry leaders and elevate your professional reputation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Section */}
      <section className={styles.applicationSection} id="apply">
        <div className={styles.container}>
          <div className={styles.applicationContent}>
            <div className={styles.applicationText}>
              <h2>Ready to Join Our Team?</h2>
              <p>Ready to elevate your barbering career? Join our established team of master barbers where your experience and skills will be valued and rewarded. We're actively seeking talented, experienced barbers to join our growing team.</p>
              <Link href="#contact" className={styles.btnPrimary}>
                Apply Now
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5 12h14m-7-7l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h3>Barbers/Nail Tech/make-up artist Application form</h3>
                <p>Submit your details, experience, and portfolio to join our elite team of master barbers</p>
              </div>
              
              <BarberApplicationForm />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.contactSection} id="contact">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Get in Touch</div>
            <h2 className={styles.sectionTitle}>Connect With Our Recruitment Team</h2>
            <p className={styles.sectionSubtitle}>Ready to discuss joining our barber team? Our recruitment team is here to answer your questions</p>
          </div>
          
          <div className={styles.contactGrid}>
            <a className={styles.contactCard} href="tel:02013306086">
              <div className={styles.contactIcon}>
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                </svg>
              </div>
              <h4>Call Us</h4>
              <p>02013306086</p>
            </a>
            
            <a className={styles.contactCard} href="mailto:Support@bbslimited.online">
              <div className={styles.contactIcon}>
                <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                </svg>
              </div>
              <h4>Email Us</h4>
              <p>Support@bbslimited.online</p>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// Barber Application Form Component
function BarberApplicationForm() {
  const searchParams = useSearchParams();
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [verifyingToken, setVerifyingToken] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherName: '',
    dateOfBirth: '',
    email: '',
    maritalStatus: '',
    phone: '',
    state: '',
    address: '',
    ninNumber: '',
    gender: '',
    experienceYears: '',
    barberLicence: '',
    skillHaircut: false,
    skillDreadlocks: false,
    skillNailsCut: false,
    skillHairstyles: false,
    skillMakeup: false,
    portfolioUrl: '',
    whyJoinNetwork: '',
    declarationAccepted: false,
    applicationLetter: null as File | null,
    cv: null as File | null,
  });
  const [applicationLetterUrl, setApplicationLetterUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for invitation token and email in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (token && email) {
      setInvitationToken(token);
      setInvitationEmail(email);
      setFormData(prev => ({ ...prev, email }));
      
      // Verify token
      verifyInvitationToken(token, email);
    } else {
      setVerifyingToken(false);
      setTokenValid(true); // Allow public applications
    }
  }, [searchParams]);

  const verifyInvitationToken = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/v1/admin/barbers/verify-invitation?token=${token}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setTokenValid(true);
        // Pre-fill name if available
        if (data.data.name) {
          const nameParts = data.data.name.split(' ');
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: email,
          }));
        }
      } else {
        setTokenValid(false);
        setError('Invalid or expired invitation link. Please contact the administrator.');
      }
    } catch (err) {
      setTokenValid(false);
      setError('Failed to verify invitation. Please try again or contact the administrator.');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'letter' | 'cv'): Promise<string | null> => {
    if (type === 'letter') {
      setUploadingLetter(true);
    } else {
      setUploadingCv(true);
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/admin/barber-applications/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        if (type === 'letter') {
          setUploadingLetter(false);
        } else {
          setUploadingCv(false);
        }
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'File upload failed');
      }
    } catch (err: any) {
      if (type === 'letter') {
        setUploadingLetter(false);
      } else {
        setUploadingCv(false);
      }
      setError(err.message || 'Failed to upload file');
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'letter' | 'cv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and JPG files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const url = await handleFileUpload(file, type);
    if (url) {
      if (type === 'letter') {
        setApplicationLetterUrl(url);
        setFormData({ ...formData, applicationLetter: file });
      } else {
        setCvUrl(url);
        setFormData({ ...formData, cv: file });
      }
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.declarationAccepted) {
      setError('Please confirm that the information provided is accurate and complete');
      return;
    }
    
    if (!applicationLetterUrl) {
      setError('Please upload your application letter');
      return;
    }

    if (!cvUrl) {
      setError('Please upload your CV/Resume');
      return;
    }

    setSubmitting(true);
    setError('');

    // Build specialties array from skills
    const specialties: string[] = [];
    if (formData.skillHaircut) specialties.push('Haircut');
    if (formData.skillDreadlocks) specialties.push('Dreadlocks');
    if (formData.skillNailsCut) specialties.push('Nails Cut');
    if (formData.skillHairstyles) specialties.push('Hairstyles');
    if (formData.skillMakeup) specialties.push('Makeup');

    try {
      const response = await fetch('/api/v1/admin/barber-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          otherName: formData.otherName || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          email: formData.email,
          maritalStatus: formData.maritalStatus || undefined,
          phone: formData.phone,
          state: formData.state || undefined,
          address: formData.address,
          ninNumber: formData.ninNumber || undefined,
          gender: formData.gender || undefined,
          experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
          barberLicence: formData.barberLicence || undefined,
          specialties: specialties.length > 0 ? specialties : undefined,
          portfolioUrl: formData.portfolioUrl || undefined,
          whyJoinNetwork: formData.whyJoinNetwork || undefined,
          applicationLetterUrl,
          cvUrl,
          invitationToken: invitationToken || undefined, // Include token if present
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          otherName: '',
          dateOfBirth: '',
          email: '',
          maritalStatus: '',
          phone: '',
          state: '',
          address: '',
          ninNumber: '',
          gender: '',
          experienceYears: '',
          barberLicence: '',
          skillHaircut: false,
          skillDreadlocks: false,
          skillNailsCut: false,
          skillHairstyles: false,
          skillMakeup: false,
          portfolioUrl: '',
          whyJoinNetwork: '',
          declarationAccepted: false,
          applicationLetter: null,
          cv: null,
        });
        setApplicationLetterUrl('');
        setCvUrl('');
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(data.error?.message || 'Failed to submit application. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setFormData({
      ...formData,
      [target.name]: value,
    });
  };

  // Show loading state while verifying token
  if (verifyingToken) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Verifying invitation...</p>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ background: '#fee', color: '#c33', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>Invalid Invitation Link</h3>
          <p>{error || 'This invitation link is invalid or has expired.'}</p>
          <p>Please contact the administrator for a new invitation link.</p>
        </div>
        <Link href="/" className={styles.btnPrimary}>
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.barberForm}>
      {invitationToken && (
        <div style={{ 
          background: '#e8f5e9', 
          color: '#2e7d32', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #4caf50'
        }}>
          <strong>✓ Invitation Verified</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            You're completing your application as an invited staff member. Please fill out all required fields below.
          </p>
        </div>
      )}
      {/* 1. First name last name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className={styles.formGroup}>
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* 2. Other name */}
      <div className={styles.formGroup}>
        <label htmlFor="otherName">Other Name</label>
        <input
          type="text"
          id="otherName"
          name="otherName"
          value={formData.otherName}
          onChange={handleChange}
        />
      </div>

      {/* 3. Date of birth */}
      <div className={styles.formGroup}>
        <label htmlFor="dateOfBirth">Date of Birth *</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />
      </div>

      {/* 4. Email */}
      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      {/* 5. Marital status */}
      <div className={styles.formGroup}>
        <label htmlFor="maritalStatus">Marital Status *</label>
        <select
          id="maritalStatus"
          name="maritalStatus"
          value={formData.maritalStatus}
          onChange={handleChange}
          required
        >
          <option value="">Select marital status</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>

      {/* 6. Phone number */}
      <div className={styles.formGroup}>
        <label htmlFor="phone">Phone Number *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      {/* 7. State of residence */}
      <div className={styles.formGroup}>
        <label htmlFor="state">State of Residence *</label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
        >
          <option value="">Select State</option>
          <option value="Abia">Abia</option>
          <option value="Adamawa">Adamawa</option>
          <option value="Akwa Ibom">Akwa Ibom</option>
          <option value="Anambra">Anambra</option>
          <option value="Bauchi">Bauchi</option>
          <option value="Bayelsa">Bayelsa</option>
          <option value="Benue">Benue</option>
          <option value="Borno">Borno</option>
          <option value="Cross River">Cross River</option>
          <option value="Delta">Delta</option>
          <option value="Ebonyi">Ebonyi</option>
          <option value="Edo">Edo</option>
          <option value="Ekiti">Ekiti</option>
          <option value="Enugu">Enugu</option>
          <option value="FCT">FCT (Abuja)</option>
          <option value="Gombe">Gombe</option>
          <option value="Imo">Imo</option>
          <option value="Jigawa">Jigawa</option>
          <option value="Kaduna">Kaduna</option>
          <option value="Kano">Kano</option>
          <option value="Katsina">Katsina</option>
          <option value="Kebbi">Kebbi</option>
          <option value="Kogi">Kogi</option>
          <option value="Kwara">Kwara</option>
          <option value="Lagos">Lagos</option>
          <option value="Nasarawa">Nasarawa</option>
          <option value="Niger">Niger</option>
          <option value="Ogun">Ogun</option>
          <option value="Ondo">Ondo</option>
          <option value="Osun">Osun</option>
          <option value="Oyo">Oyo</option>
          <option value="Plateau">Plateau</option>
          <option value="Rivers">Rivers</option>
          <option value="Sokoto">Sokoto</option>
          <option value="Taraba">Taraba</option>
          <option value="Yobe">Yobe</option>
          <option value="Zamfara">Zamfara</option>
        </select>
      </div>

      {/* 8. Location/address */}
      <div className={styles.formGroup}>
        <label htmlFor="address">Location/Address *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter your exact address or location"
          required
        />
      </div>

      {/* 9. NIN number */}
      <div className={styles.formGroup}>
        <label htmlFor="ninNumber">NIN Number *</label>
        <input
          type="text"
          id="ninNumber"
          name="ninNumber"
          value={formData.ninNumber}
          onChange={handleChange}
          placeholder="National Identification Number"
          required
        />
      </div>

      {/* 10. Gender */}
      <div className={styles.formGroup}>
        <label htmlFor="gender">Gender *</label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* 11. Years of experience */}
      <div className={styles.formGroup}>
        <label htmlFor="experienceYears">Years of Experience *</label>
        <input
          type="number"
          id="experienceYears"
          name="experienceYears"
          value={formData.experienceYears}
          onChange={handleChange}
          min="0"
          placeholder="e.g. 5"
          required
        />
      </div>

      {/* 12. Barber licence (optional text, not upload) */}
      <div className={styles.formGroup}>
        <label htmlFor="barberLicence">Barber Licence (Optional)</label>
        <input
          type="text"
          id="barberLicence"
          name="barberLicence"
          value={formData.barberLicence}
          onChange={handleChange}
          placeholder="Enter your barber licence number if available"
        />
      </div>

      {/* 13-17. Skills checkboxes */}
      <div className={styles.formGroup}>
        <label style={{ marginBottom: '12px', display: 'block', fontWeight: 600 }}>Skills (Select all that apply)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="skillHaircut"
              checked={formData.skillHaircut}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I'm very good with haircut</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="skillDreadlocks"
              checked={formData.skillDreadlocks}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I'm very good with dreadlocks</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="skillNailsCut"
              checked={formData.skillNailsCut}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I'm very good with nails cut</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="skillHairstyles"
              checked={formData.skillHairstyles}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I'm very good with hairstyles</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="skillMakeup"
              checked={formData.skillMakeup}
              onChange={handleCheckboxChange}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>I'm very good with makeup</span>
          </label>
        </div>
      </div>

      {/* 18. Social media Link (optional) */}
      <div className={styles.formGroup}>
        <label htmlFor="portfolioUrl">Social Media Link (Optional)</label>
        <input
          type="url"
          id="portfolioUrl"
          name="portfolioUrl"
          value={formData.portfolioUrl}
          onChange={handleChange}
          placeholder="https://instagram.com/yourhandle or https://yourportfolio.com"
        />
      </div>

      {/* 19. Why do you want to join our network */}
      <div className={styles.formGroup}>
        <label htmlFor="whyJoinNetwork">Why do you want to join our network? *</label>
        <textarea
          id="whyJoinNetwork"
          name="whyJoinNetwork"
          value={formData.whyJoinNetwork}
          onChange={handleChange}
          rows={5}
          placeholder="Tell us why you want to join our network..."
          required
        />
      </div>

      {/* 20. Upload application letter and CV (PDF or JPG) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className={styles.formGroup}>
          <label htmlFor="applicationLetter">Application Letter * (PDF or JPG)</label>
          <input
            type="file"
            id="applicationLetter"
            name="applicationLetter"
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => handleFileChange(e, 'letter')}
            required
          />
          {uploadingLetter && <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Uploading...</p>}
          {applicationLetterUrl && <p style={{ color: '#46b450', fontSize: '0.9rem', marginTop: '4px' }}>✓ File uploaded</p>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cv">CV/Resume * (PDF or JPG)</label>
          <input
            type="file"
            id="cv"
            name="cv"
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => handleFileChange(e, 'cv')}
            required
          />
          {uploadingCv && <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>Uploading...</p>}
          {cvUrl && <p style={{ color: '#46b450', fontSize: '0.9rem', marginTop: '4px' }}>✓ File uploaded</p>}
        </div>
      </div>

      {/* 21. Declaration */}

      <div className={styles.formGroup}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            id="declarationAccepted"
            name="declarationAccepted"
            checked={formData.declarationAccepted}
            onChange={handleChange}
            required
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>I confirm the information provided above is accurate and complete. *</span>
        </label>
      </div>

      <button type="submit" className={styles.btnSubmit} disabled={submitting || uploadingLetter || uploadingCv}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </button>

      {error && (
        <div className={styles.formError} style={{ color: '#dc3232', marginTop: '12px', padding: '12px', background: '#ffe5e5', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {submitted && (
        <div className={styles.formSuccess}>
          Thank you! Your application has been submitted successfully. We'll review it and get back to you soon.
        </div>
      )}
    </form>
  );
}

export default function BarberRecruitPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>}>
      <BarberRecruitPageContent />
    </Suspense>
  );
}
