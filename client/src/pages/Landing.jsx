import { Link } from 'react-router-dom';


function Landing() {
  return (
    <div className="landing-page">
      {/* Header & Navigation */}
      <header className="landing-header">
        <nav className="landing-nav">
          <div className="nav-container">
            <div className="nav-brand">
              <img src="/logo-a.png" alt="CostInsight Logo" className="brand-logo-img" />
              <span>CostInsight</span>
            </div>
            <div className="nav-links">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link-button">Get Started</Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">AI-Powered AWS Cost Optimization</span>
            </h1>
            <p className="hero-description">
              Unlock the full potential of your AWS cloud with real-time analytics, smart recommendations, and enterprise-grade security. <br />
              <span style={{ color: '#FFB84D', fontWeight: 600 }}>Save more. Grow faster. Stay in control.</span>
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn-primary">
                <i className="fa-solid fa-circle-play"></i> Start Free Trial
              </Link>
              <Link to="/login" className="btn-secondary">
                <i className="fa-solid fa-sign-in-alt"></i> Sign In
              </Link>
            </div>
          </div>
          <div className="hero-logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="250" height="250" fill="#FF9900">
              <path d="M19.684 18.335a.5.5 0 0 0-.291.032a20.4 20.4 0 0 1-4.385 1.469a14.57 14.57 0 0 1-8.965-.979a34 34 0 0 1-3.368-1.806a.23.23 0 0 0-.129-.051a.24.24 0 0 0-.13.022a.23.23 0 0 0-.09.075a.15.15 0 0 0-.01.132a.5.5 0 0 0 .113.181a10 10 0 0 0 .942.951a14.5 14.5 0 0 0 1.486 1.142a15 15 0 0 0 1.935 1.133a12 12 0 0 0 2.345.832a11 11 0 0 0 2.67.337a12.5 12.5 0 0 0 2.574-.266a12 12 0 0 0 2.111-.632a12 12 0 0 0 1.581-.806a8.6 8.6 0 0 0 1.071-.739a4 4 0 0 0 .493-.474a.6.6 0 0 0 .169-.363q-.001-.164-.122-.193M12.421 8.067a13 13 0 0 0-1.342.2a11 11 0 0 0-1.459.376a8 8 0 0 0-1.374.62a5.3 5.3 0 0 0-1.2.9a3.9 3.9 0 0 0-.808 1.268a4.4 4.4 0 0 0-.315 1.677a4.3 4.3 0 0 0 .349 1.769a3.1 3.1 0 0 0 .932 1.23a4.7 4.7 0 0 0 1.318.713a4.1 4.1 0 0 0 1.542.229a6.7 6.7 0 0 0 1.572-.251a4.7 4.7 0 0 0 1.43-.691A4.3 4.3 0 0 0 14.164 15a2 2 0 0 0 .28.359l.213.217q.212.216.651.637q.438.42.886.822l2.548-2.438l-.147-.119a3 3 0 0 1-.371-.349a6 6 0 0 1-.419-.5a2.8 2.8 0 0 1-.359-.632a1.8 1.8 0 0 1-.151-.7V5.885a2.6 2.6 0 0 0-.139-.8a3.6 3.6 0 0 0-.506-.935a4.1 4.1 0 0 0-.907-.9a4.8 4.8 0 0 0-1.455-.669a7.1 7.1 0 0 0-2.03-.27a8.3 8.3 0 0 0-2.138.266a6.2 6.2 0 0 0-1.7.712a5.4 5.4 0 0 0-1.213 1.032a4.2 4.2 0 0 0-.752 1.23a3.6 3.6 0 0 0-.246 1.3l3.3.291a3.7 3.7 0 0 1 .537-1.045a3 3 0 0 1 .629-.646a2.7 2.7 0 0 1 .627-.322a2.6 2.6 0 0 1 .454-.132a2 2 0 0 1 .186-.01a1.51 1.51 0 0 1 1.357.576a1.9 1.9 0 0 1 .236 1.057V8q-.557.022-1.113.071m1.116 3.706a3.6 3.6 0 0 1-.159 1.1a1.86 1.86 0 0 1-1.279 1.332a1.8 1.8 0 0 1-1.559-.24a1.63 1.63 0 0 1-.786-1.447a2.1 2.1 0 0 1 .366-1.247a2.23 2.23 0 0 1 .979-.775a5.8 5.8 0 0 1 1.2-.364a8 8 0 0 1 1.245-.132zm8.179 5.342q-.157-.197-.851-.261a5 5 0 0 0-1.213.01a4 4 0 0 0-1.154.327c-.4.173-.571.319-.527.434l.017.032l.022.017h.224c.034 0 .066-.008.095-.01l.125-.01a1 1 0 0 0 .146-.017l.252-.022q.242-.02.348-.032a7 7 0 0 1 .354-.022a4 4 0 0 1 .393 0c.1.008.208.018.332.027a1 1 0 0 1 .3.066a.4.4 0 0 1 .173.125q.188.24-.073 1.071a11 11 0 0 1-.5 1.323q-.102.207 0 .261c.068.037.163 0 .29-.1a3.3 3.3 0 0 0 .954-1.349a5 5 0 0 0 .32-1.116a1.2 1.2 0 0 0-.032-.756" />
            </svg>
          </div>
        </section>

        {/* ...hero-stats section removed as requested... */}
      </header>

      {/* Main Content */}
      <main>
        {/* Features Section */}
        <section className="features-section" style={{ paddingBottom: 60 }}>
          <div className="section-container">
            <div className="section-header-center">
              <h2>Why Choose CostInsight?</h2>
              <p>All-in-one AWS cost management, powered by AI. Designed for modern teams and enterprises.</p>
            </div>
            <div className="features-grid">
              {/* ...existing feature cards... */}
              <div className="feature-card">
                <div className="feature-icon primary">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <h3>Real-Time Cost Analytics</h3>
                <p>Monitor AWS spending across services with live dashboards, custom alerts, and detailed breakdowns by region and resource tags.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon success">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <h3>AI-Powered Optimization</h3>
                <p>AI analyzes your infrastructure patterns and provides intelligent recommendations to reduce costs while maintaining performance.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon warning">
                  <i className="fa-solid fa-server"></i>
                </div>
                <h3>Multi-Service Infrastructure Analysis</h3>
                <p>Deep insights into EC2, RDS, Lambda, EBS, and all AWS compute resources.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon info">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <h3>Intelligent Alerting System</h3>
                <p>Proactive notifications for cost anomalies, budget thresholds, and optimization opportunities with customizable alert rules.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon error">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h3>Security & Compliance</h3>
                <p>Secure credential storage, AWS IAM integration, encrypted data, and compliance-ready infrastructure.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon secondary">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h3>Historical Trend Analysis</h3>
                <p>Track spending patterns over time with advanced analytics, forecasting, and year-over-year cost comparison reports.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section" style={{ paddingTop: 0, marginTop: -40 }}>
          <div className="section-container">
            <div className="section-header-center">
              <h2>How It Works</h2>
              <p>Get started in minutes. See results instantly.</p>
            </div>
            <div className="steps-container">
              {/* ...existing step items... */}
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Connect AWS</h3>
                  <p>Securely connect your AWS account with read-only IAM credentials.</p>
                </div>
              </div>
              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Scan & Analyze</h3>
                  <p>Automated scan of all AWS resources, services, and cost data.</p>
                </div>
              </div>
              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>AI Recommendations</h3>
                  <p>Receive custom optimization strategies and cost-saving tips.</p>
                </div>
              </div>
              <div className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Implement & Save</h3>
                  <p>Apply recommendations and watch your AWS bills decrease.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ...CTA section removed as requested... */}
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/logo-a.png" alt="CostInsight Logo" className="brand-logo-img" />
            <span>CostInsight</span>
          </div>
          <div className="footer-madeby">
            <div className="footer-madeby-title">Made by</div>
            <div className="footer-madeby-list">
              <div className="footer-person">
                <span className="footer-person-name">Abhay Verma</span>
                <span className="footer-person-role">Software Developer</span>
              </div>
              <div className="footer-person">
                <span className="footer-person-name">Ananya Chaurasia</span>
                <span className="footer-person-role">Cloud & Software Developer</span>
              </div>
            </div>
            <div className="footer-email">abhayverma5545@gmail.com</div>
            <div className="footer-copyright">© 2026 CostInsight. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
