import express from 'express';

// Local stand-in for the Blocky402 facilitator, for offline development of the x402 flow.
// It accepts every payment and reports a fake transaction id. NEVER use outside dev.
const app = express();
app.use(express.json({ limit: '1mb' }));

const network = 'hedera:testnet';
const feePayer = process.env.STUB_FEE_PAYER ?? '0.0.999999';

app.get('/supported', (_req, res) => {
  res.json({
    kinds: [{ x402Version: 2, scheme: 'exact', network, extra: { feePayer } }],
    extensions: [],
    signers: { [network]: [feePayer] },
  });
});

app.post('/verify', (req, res) => {
  const payer = req.body?.paymentPayload?.payload?.payer ?? 'stub-payer';
  console.log('[stub-facilitator] verify', req.body?.paymentRequirements?.amount, req.body?.paymentRequirements?.asset);
  res.json({ isValid: true, payer });
});

app.post('/settle', (req, res) => {
  const txId = `${feePayer}@${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1e9)}`;
  console.log('[stub-facilitator] settle →', txId);
  res.json({ success: true, transaction: txId, network, payer: req.body?.paymentPayload?.payload?.payer ?? 'stub-payer' });
});

const port = Number(process.env.STUB_PORT ?? 3999);
app.listen(port, () => console.log(`stub x402 facilitator on http://localhost:${port}`));
