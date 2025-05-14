import BackButton from "../components/BackButton";

const PreviewPage = () => {
    return (
      <div className="container mt-4 mb-4">
        <h2>Preview Page</h2>
        {/* Back button */}
        <BackButton position="absolute" top="20px" right="20px" />
      </div>
    );
  };
  
  export default PreviewPage;
  