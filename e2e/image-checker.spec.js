import { test, expect } from '@playwright/test';

test.describe('巴基斯坦图片本地化检查器 - E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('页面加载测试', async ({ page }) => {
    // 检查标题
    await expect(page.locator('h1')).toContainText('巴基斯坦本地化图片合规检查器');

    // 检查副标题 - 使用 getByText
    await expect(page.getByText('检查图片设计是否符合巴基斯坦的语言习惯')).toBeVisible();

    // 检查 Tab 切换按钮 - 使用 text 选择器
    await expect(page.getByText('文件上传')).toBeVisible();
    await expect(page.getByText('URL 输入')).toBeVisible();
  });

  test('URL 输入模式测试', async ({ page }) => {
    // 切换到 URL 输入模式
    await page.getByText('URL 输入').click();

    // 检查输入框是否显示
    const urlInput = page.locator('input[type="text"]');
    await expect(urlInput).toBeVisible();

    // 输入测试图片 URL
    const testImageUrl = 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac';
    await urlInput.fill(testImageUrl);

    // 点击加载图片按钮
    await page.getByText('加载图片').click();

    // 等待图片预览出现
    const previewImage = page.locator('img').first();
    await expect(previewImage).toBeVisible({ timeout: 10000 });

    // 检查"重新选择"按钮是否显示
    await expect(page.getByText('重新选择')).toBeVisible();
  });

  test('文件上传模式测试', async ({ page }) => {
    // 切换到文件上传模式
    await page.getByText('文件上传').click();

    // 检查上传区域是否显示
    await expect(page.getByText('拖拽图片到此处')).toBeVisible();

    // 创建一个测试图片文件
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // 模拟文件上传
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('拖拽图片到此处').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage
    });

    // 等待图片预览
    const previewImage = page.locator('img').first();
    await expect(previewImage).toBeVisible({ timeout: 5000 });
  });

  test('错误处理测试 - 无效 URL', async ({ page }) => {
    // 切换到 URL 输入模式
    await page.getByText('URL 输入').click();

    // 输入无效 URL
    await page.locator('input[type="text"]').fill('not-a-valid-url');
    await page.getByText('加载图片').click();

    // 检查错误提示
    await expect(page.getByText(/请输入有效的图片 URL/)).toBeVisible({ timeout: 5000 });
  });

  test('Tab 切换测试', async ({ page }) => {
    // 检查默认状态 - 文件上传应该被选中
    await expect(page.getByText('文件上传')).toBeVisible();

    // 切换到 URL 输入
    await page.getByText('URL 输入').click();
    await expect(page.getByText('URL 输入')).toBeVisible();

    // 切换回文件上传
    await page.getByText('文件上传').click();
    await expect(page.getByText('文件上传')).toBeVisible();
  });

  test('响应式设计测试 - 移动端', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    // 检查页面是否正常显示
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('文件上传')).toBeVisible();

    // 切换到 URL 输入模式
    await page.getByText('URL 输入').click();

    // 检查输入框和按钮是否可点击
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.getByText('加载图片')).toBeVisible();
  });

  test('重新选择功能测试', async ({ page }) => {
    // 切换到 URL 输入模式
    await page.getByText('URL 输入').click();

    // 加载图片
    await page.locator('input[type="text"]').fill('https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac');
    await page.getByText('加载图片').click();

    // 等待图片加载
    await page.waitForSelector('img', { timeout: 10000 });

    // 点击重新选择
    await page.getByText('重新选择').click();

    // 检查输入框是否清空
    const inputValue = await page.locator('input[type="text"]').inputValue();
    expect(inputValue).toBe('');
  });

  test('图片分析功能测试', async ({ page }) => {
    // 切换到 URL 输入模式
    await page.getByText('URL 输入').click();

    // 输入测试图片 URL
    const testImageUrl = 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac';
    await page.locator('input[type="text"]').fill(testImageUrl);
    await page.getByText('加载图片').click();

    // 等待图片加载
    await page.waitForSelector('img', { timeout: 10000 });

    // 点击开始分析按钮
    await page.getByText('开始分析').click();

    // 等待分析完成（最多30秒）
    await expect(page.getByText(/分析中/)).toBeVisible();
    await expect(page.getByText(/分析中/)).toBeHidden({ timeout: 30000 });

    // 检查结果是否显示 - 使用更灵活的选择器
    const hasResultText = page.getByText(/发现问题|未发现问题/);
    await expect(hasResultText.first()).toBeVisible({ timeout: 5000 });

    // 检查"检查其他图片"按钮是否显示
    await expect(page.getByText('检查其他图片')).toBeVisible({ timeout: 5000 });
  });
});
