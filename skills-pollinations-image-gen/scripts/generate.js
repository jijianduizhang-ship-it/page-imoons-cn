#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
let prompt = '';
let model = 'flux';
let width = 512;
let height = 512;
let seed = null;
let saveOnly = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--model') model = args[++i] || 'flux';
  else if (args[i] === '--width') width = parseInt(args[++i]) || 512;
  else if (args[i] === '--height') height = parseInt(args[++i]) || 512;
  else if (args[i] === '--seed') seed = parseInt(args[++i]) || null;
  else if (args[i] === '--save-only') saveOnly = true;
  else if (!args[i].startsWith('--')) prompt = args[i];
}

if (!prompt) {
  console.error('❌ 请提供图片描述（prompt）');
  console.error('用法: node generate.js "<描述>" [--model flux] [--width 512] [--height 512] [--seed 12345] [--save-only]');
  process.exit(1);
}

// Detect if text contains Chinese characters
function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

// Translate Chinese to English using MyMemory (free, no API key)
function translate(text) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=zh-CN|en`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.responseStatus === 200 && json.responseData?.translatedText) {
            resolve(json.responseData.translatedText);
          } else {
            reject(new Error('Translation API error: ' + json.responseStatus));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((res, rej) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, resp => {
      if (resp.statusCode !== 200) { rej(new Error(`HTTP ${resp.statusCode}`)); return; }
      resp.pipe(file);
      file.on('finish', () => { file.close(); res(); });
    }).on('error', rej);
  });
}

async function main() {
  let finalPrompt = prompt.trim();

  // Auto-translate Chinese to English
  if (hasChinese(finalPrompt)) {
    console.log(`🔤 检测到中文，正在翻译...`);
    try {
      finalPrompt = await translate(finalPrompt);
      console.log(`✨ 翻译结果: ${finalPrompt}`);
    } catch (e) {
      console.warn(`⚠️ 翻译失败，使用原文: ${e.message}`);
    }
  }

  const seedVal = seed || Math.floor(Math.random() * 99999999);
  const encoded = encodeURIComponent(finalPrompt);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&model=${model}&seed=${seedVal}&nologo=true`;

  console.log(`🎨 生成中...`);
  console.log(`   Prompt: ${finalPrompt}`);
  console.log(`   模型: ${model.toUpperCase()} | 尺寸: ${width}×${height} | Seed: ${seedVal}`);

  const outDir = '/tmp/ai-images';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `img_${seedVal}.png`);

  try {
    await download(apiUrl, outFile);
    console.log(`\n✅ 生成成功！`);
    console.log(`   📷 图片: ${outFile}`);
    console.log(`   🔗 URL: ${apiUrl}`);
    console.log(`   🎲 Seed: ${seedVal}`);
    execSync(`cp "${outFile}" /tmp/ai-images/latest.png`, { stdio: 'ignore' });
    if (saveOnly) {
      console.log(`📁 已保存，URL: ${apiUrl}`);
    }
  } catch (err) {
    console.error(`\n❌ 生成失败: ${err.message}`);
    process.exit(1);
  }
}

main();
