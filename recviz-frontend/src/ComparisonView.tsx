import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, IconButton, CircularProgress, Box, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Stack from '@mui/material/Stack';
import TopKVisualiser from "./TopKVisualiser";

interface ComparisonViewProps {
  dataset: string;
  model1: string;
  model2: string;
  user1: string;
  user2: string;
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ dataset, model1, model2, user1, user2, onClose }) => {
  const [similarityMetrics, setSimilarityMetrics] = useState<string>(null);
  const [graphSimilarityMetrics, setGraphSimilarityMetrics] = useState<string>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [k, setK] = useState<number>(10);

  useEffect(() => {
    const fetchSimilarityMetrics = async () => {
      try {
        console.log(`http://localhost:8000/recvizapi/calculate_user_similarity_metrics/${dataset}/${model1}/${model2}/${k}/${user1}/${user2}`);
        const response = await fetch(
          `http://localhost:8000/recvizapi/calculate_user_similarity_metrics/${dataset}/${model1}/${model2}/${k}/${user1}/${user2}`
        );
        if (!response.ok) throw new Error("Failed to fetch similarity metrics");
        const data = await response.json();
        setSimilarityMetrics(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const fetchGraphSimilarityMetrics = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/recvizapi/get_user_interaction_graph_similarity_metrics/${dataset}/${user1}/${user2}`
        );
        if (!response.ok) throw new Error("Failed to fetch graph similarity metrics");
        const data = await response.json();
        setGraphSimilarityMetrics(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarityMetrics();
    fetchGraphSimilarityMetrics();
  }, [dataset, user1, user2, k]);

  const exportCSV = () => {
    if (!similarityMetrics || !graphSimilarityMetrics) return;

    let csvContent = "Card,Metric,Value\n";

    csvContent += `Similarity of recommendations,Overlap Coefficient,${similarityMetrics.overlap_recs}\n`;
    csvContent += `Similarity of recommendations,Sorenson-Dice,${similarityMetrics.sorenson_recs}\n`;
    csvContent += `Similarity of recommendations,Jaccard,${similarityMetrics.jaccard_recs}\n`;
    csvContent += `Similarity of recommendations,Cosine,${similarityMetrics.cosine_recs}\n`;

    csvContent += `Similarity of interaction histories,Overlap Coefficient,${similarityMetrics.overlap_hist}\n`;
    csvContent += `Similarity of interaction histories,Sorenson-Dice,${similarityMetrics.sorenson_hist}\n`;
    csvContent += `Similarity of interaction histories,Jaccard,${similarityMetrics.jaccard_hist}\n`;
    csvContent += `Similarity of interaction histories,Cosine,${similarityMetrics.cosine_hist}\n`;
    csvContent += `Similarity of interaction histories,Panther,${graphSimilarityMetrics.panther_similarity}\n`;

    csvContent += `User ${user1} recommendations v.s. their interaction history,Overlap Coefficient,${similarityMetrics.overlap_rh1}\n`;
    csvContent += `User ${user1} recommendations v.s. their interaction history,Sorenson-Dice,${similarityMetrics.sorenson_rh1}\n`;
    csvContent += `User ${user1} recommendations v.s. their interaction history,Jaccard,${similarityMetrics.jaccard_rh1}\n`;
    csvContent += `User ${user1} recommendations v.s. their interaction history,Cosine,${similarityMetrics.cosine_rh1}\n`;

    csvContent += `User ${user2} recommendations v.s. their interaction history,Overlap Coefficient,${similarityMetrics.overlap_rh2}\n`;
    csvContent += `User ${user2} recommendations v.s. their interaction history,Sorenson-Dice,${similarityMetrics.sorenson_rh2}\n`;
    csvContent += `User ${user2} recommendations v.s. their interaction history,Jaccard,${similarityMetrics.jaccard_rh2}\n`;
    csvContent += `User ${user2} recommendations v.s. their interaction history,Cosine,${similarityMetrics.cosine_rh2}\n`;

    csvContent += `User ${user1} recommendations v.s. ground truth,Overlap Coefficient,${similarityMetrics.overlap_rg1}\n`;
    csvContent += `User ${user1} recommendations v.s. ground truth,Sorenson-Dice,${similarityMetrics.sorenson_rg1}\n`;
    csvContent += `User ${user1} recommendations v.s. ground truth,Jaccard,${similarityMetrics.jaccard_rg1}\n`;
    csvContent += `User ${user1} recommendations v.s. ground truth,Cosine,${similarityMetrics.cosine_rg1}\n`;

    csvContent += `User ${user2} recommendations v.s. ground truth,Overlap Coefficient,${similarityMetrics.overlap_rg2}\n`;
    csvContent += `User ${user2} recommendations v.s. ground truth,Sorenson-Dice,${similarityMetrics.sorenson_rg2}\n`;
    csvContent += `User ${user2} recommendations v.s. ground truth,Jaccard,${similarityMetrics.jaccard_rg2}\n`;
    csvContent += `User ${user2} recommendations v.s. ground truth,Cosine,${similarityMetrics.cosine_rg2}\n`;

    const downloadBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dataset + "_" + "user-" + user1 + "_vs_" + "user-" + user2 + "_metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card style={{ width: "100%", height: "100%", overflowY: "auto"}}>
      <CardContent style={{ height: "100%", position: "relative" }}>
        <IconButton onClick={onClose} style={{ position: "absolute", top: 8, right: 8 }} aria-label="close">
          <CloseIcon />
        </IconButton>
        <Typography variant="h4" align="center" gutterBottom>
          Comparison between User {user1} (left) and User {user2} (right)
        </Typography>
        <TopKVisualiser dataset={dataset} model1={model1} model2={model2} k={k} setK={setK} user1={user1} user2={user2} />
        {loading ? (
          <CircularProgress style={{ display: "block", margin: "20px auto" }} />
        ) : error ? (
          <Typography color="error">Error: {error}</Typography>
        ) : similarityMetrics && graphSimilarityMetrics ? (
            <Stack>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ marginLeft: "8px", marginTop: "32px", marginBottom: "12px" }}>
                <Typography variant="h4">Metrics</Typography>
                <Button variant="contained" onClick={exportCSV}>Export CSV</Button>
              </Box>
              <Stack direction="row" spacing={2} sx={{marginBottom: "16px"}}>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>Similarity of recommendations</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_recs.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_recs.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_recs.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_recs.toPrecision(3))}</Typography>
                </Card>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>Similarity of interaction histories</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_hist.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_hist.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_hist.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_hist.toPrecision(3))}</Typography>
                  <Typography>Panther: {parseFloat(graphSimilarityMetrics.panther_similarity.toPrecision(3))}</Typography>
                </Card>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>User {user1} recommendations v.s. their interaction history</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_rh1.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_rh1.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_rh1.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_rh1.toPrecision(3))}</Typography>
                </Card>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>User {user2} recommendations v.s. their interaction history</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_rh2.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_rh2.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_rh2.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_rh2.toPrecision(3))}</Typography>
                </Card>
              </Stack>
              <Stack direction="row" spacing={2} sx={{marginBottom: "16px"}}>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>User {user1} recommendations v.s. ground truth</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_rg1.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_rg1.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_rg1.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_rg1.toPrecision(3))}</Typography>
                </Card>
                <Card variant="outlined" sx={{padding: "1rem"}}>
                  <Typography variant="h6" sx={{marginBottom: "12px"}}>User {user2} recommendations v.s. ground truth</Typography>
                  <Typography>Overlap Coefficient: {parseFloat(similarityMetrics.overlap_rg2.toPrecision(3))}</Typography>
                  <Typography>Sorenson-Dice: {parseFloat(similarityMetrics.sorenson_rg2.toPrecision(3))}</Typography>
                  <Typography>Jaccard: {parseFloat(similarityMetrics.jaccard_rg2.toPrecision(3))}</Typography>
                  <Typography>Cosine: {parseFloat(similarityMetrics.cosine_rg2.toPrecision(3))}</Typography>
                </Card>
              </Stack>
            </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default ComparisonView;