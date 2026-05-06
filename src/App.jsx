export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial",
        flexDirection: "column",
        padding: "24px",
        textAlign: "center"
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "16px"
        }}
      >
        Board Game Helper
      </h1>

      <p
        style={{
          maxWidth: "500px",
          opacity: 0.8,
          fontSize: "18px"
        }}
      >
        Offline-first board game rescue application.
      </p>
    </div>
  );
}
