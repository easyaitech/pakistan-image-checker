import { getAnalysisPrompt } from '../../lib/analysis-prompts';

/**
 * 图片分析 API
 * 支持本地文件（base64）和 URL 两种输入方式
 */
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { imageSource, imageData, fileName } = req.body;

    // 验证输入参数
    if (!imageSource || !imageData) {
      return res.status(400).json({
        error: '缺少必要参数：imageSource 和 imageData'
      });
    }

    if (!['file', 'url'].includes(imageSource)) {
      return res.status(400).json({
        error: 'imageSource 必须是 "file" 或 "url"'
      });
    }

    // 验证环境变量
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('【待填写')) {
      return res.status(500).json({
        error: 'API 密钥未配置，请联系管理员'
      });
    }

    // 准备图片数据
    let imageContent;
    if (imageSource === 'file') {
      // base64 格式
      if (!imageData.startsWith('data:image')) {
        return res.status(400).json({
          error: '图片格式错误，base64 必须以 data:image/ 开头'
        });
      }
      imageContent = imageData;
    } else {
      // URL 格式
      try {
        new URL(imageData);
        imageContent = imageData;
      } catch (err) {
        return res.status(400).json({
          error: '无效的图片 URL'
        });
      }
    }

    // 调用 OpenRouter API (Claude Opus 4.5)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Pakistan Image Checker',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.5',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: getAnalysisPrompt()
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageContent
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API 错误:', errorText);
      return res.status(500).json({
        error: '图片分析失败，请稍后重试'
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 解析 AI 返回的 JSON
    let result;
    try {
      // 提取 JSON 部分（去掉可能的 markdown 代码块标记）
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        result = JSON.parse(jsonStr);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('JSON 解析错误:', parseError);
      console.error('原始内容:', content);
      return res.status(500).json({
        error: '分析结果解析失败，请重试'
      });
    }

    // 验证返回的数据结构
    if (!result.hasOwnProperty('hasIssues')) {
      return res.status(500).json({
        error: '分析结果格式错误'
      });
    }

    // 确保问题数组存在
    if (!result.issues) {
      result.issues = [];
    }

    // 返回成功响应
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      imageInfo: {
        source: imageSource,
        fileName: fileName || (imageSource === 'url' ? imageData : 'uploaded-image'),
      },
      ...result,
    });

  } catch (error) {
    console.error('API 处理错误:', error);
    return res.status(500).json({
      error: '服务器错误，请稍后重试'
    });
  }
}
