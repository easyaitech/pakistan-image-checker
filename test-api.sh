#!/bin/bash

# 测试图片分析 API
echo "🧪 测试巴基斯坦图片本地化检查器 API..."
echo ""

# 测试用的图片 URL（简单的图片）
TEST_IMAGE_URL="https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac"

echo "📤 发送请求到 API..."
echo ""

curl -X POST http://localhost:3000/api/analyze-image \
  -H "Content-Type: application/json" \
  -d "{
    \"imageSource\": \"url\",
    \"imageData\": \"$TEST_IMAGE_URL\"
  }" \
  | jq '.'

echo ""
echo "✅ 测试完成！"
echo ""
echo "💡 提示："
echo "   - 如果返回 JSON 结果，说明 API 工作正常"
echo "   - 在浏览器访问 http://localhost:3000 查看完整界面"
