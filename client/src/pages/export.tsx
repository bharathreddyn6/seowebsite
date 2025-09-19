import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { MetricData } from "@/data/mock-data";

export default function ExportPage() {
  const { data: analyses, isLoading } = useQuery<MetricData[]>({
    queryKey: ["/api/analyses"],
    queryFn: async () => {
      // a mock api call
      const response = await new Promise<MetricData[]>((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                overallScore: 85,
                seoScore: 90,
                brandScore: 80,
                socialScore: 75,
                performanceScore: 95,
                metrics: {
                  pageSpeed: 90,
                  mobileScore: 85,
                  security: 95,
                  userExperience: 80,
                },
                keywords: [],
                competitors: [],
              },
            ]),
          1000
        )
      );
      return response;
    },
  });

  const latestAnalysis = Array.isArray(analyses) ? analyses[0] : undefined;

  const handleDownloadPdf = () => {
    const input = document.getElementById("pdf-content");
    if (input) {
      html2canvas(input).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("analysis-report.pdf");
      });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold">Export Data</h1>
            <p className="text-muted-foreground">
              Analyze your data and export it as a PDF.
            </p>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Preview</CardTitle>
                  <CardDescription>
                    This is a preview of the data analysis that will be
                    exported to the PDF.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading...</p>
                  ) : (
                    <div id="pdf-content" className="p-4">
                      <h2 className="text-xl font-bold">Analysis Results</h2>
                      {latestAnalysis ? (
                        <div>
                          <p>
                            <strong>Overall Score:</strong>{" "}
                            {latestAnalysis.overallScore}
                          </p>
                          <p>
                            <strong>SEO Score:</strong> {latestAnalysis.seoScore}
                          </p>
                          <p>
                            <strong>Brand Score:</strong>{" "}
                            {latestAnalysis.brandScore}
                          </p>
                          <p>
                            <strong>Social Score:</strong>{" "}
                            {latestAnalysis.socialScore}
                          </p>
                          <p>
                            <strong>Performance Score:</strong>{" "}
                            {latestAnalysis.performanceScore}
                          </p>
                        </div>
                      ) : (
                        <p>No analysis data found.</p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleDownloadPdf}>Download PDF</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
