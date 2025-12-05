import BackButton from "../components/BackButton";

const PreviewPage = () => {
    return (
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton position="static" />
            </div>
            <h2 className="page-title">Preview Page</h2>
          </div>
          <div className="content-card">
            <p className="empty-message">Preview content coming soon...</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default PreviewPage;
  