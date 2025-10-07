import mongoose from "../db";

const { Schema } = mongoose;

const AnalysisSchema = new Schema(
  {
    url: { type: String, required: true, index: true },
    status: Number,
    responseTimeMs: Number,
    totalBytes: Number,
    contentType: String,
    title: { type: String, default: null },
    metaDescription: { type: String, default: null },
    h1Count: { type: Number, default: 0 },
    imagesTotal: { type: Number, default: 0 },
    imagesWithAlt: { type: Number, default: 0 },
    hasViewport: { type: Boolean, default: false },
    hasCanonical: { type: Boolean, default: false },
    ogTitle: { type: String, default: null },
    ogImage: { type: String, default: null },
    twitterCard: { type: String, default: null },
    wordCount: { type: Number, default: 0 },
    headers: { type: Schema.Types.Mixed, default: {} },

    // computed scores
    overallScore: { type: Number, default: 0 },
    seoScore: { type: Number, default: 0 },
    brandScore: { type: Number, default: 0 },
    socialScore: { type: Number, default: 0 },
    performanceScore: { type: Number, default: 0 },

    // optional fields for richer results
    keywords: { type: [Schema.Types.Mixed], default: [] },
    issues: { type: Schema.Types.Mixed, default: {} },
  // PageSpeed / Lighthouse metrics and KPI estimates
  psi: { type: Schema.Types.Mixed, default: null },
  kpis: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

// Avoid model overwrite error in watch/hot environments
const AnalysisModel = (mongoose.models && (mongoose.models.Analysis as any)) || mongoose.model("Analysis", AnalysisSchema);

export default AnalysisModel;
