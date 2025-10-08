# Shader修复版本使用说明

## 🚨 问题解决方案

如果你遇到 "Read effect json file in library failed" 错误，现在有两个Shader版本可供选择：

### 📁 方案一：完整版 (weather-background.effect)
- 支持色相、饱和度、亮度、天气强度调整
- 功能完整但可能在某些Cocos版本中有兼容性问题

### 📁 方案二：简化版 (simple-weather.effect) **推荐**
- 只支持天气强度调整，但更稳定兼容
- 减少了可能导致解析错误的复杂功能

## 🔧 使用步骤

### 1. 创建材质
1. 在Cocos Creator资源管理器中右键 → 新建 → Material
2. 命名为 `WeatherMaterial`
3. 选择Effect：
   - 如果`weather-background`有问题，选择`simple-weather`
   - 推荐先尝试`simple-weather`

### 2. 配置组件
1. 在背景节点添加 `WeatherShaderManager` 组件
2. 设置参数：
   - **Background Sprite**: 背景图片的Sprite组件
   - **Weather Material**: 刚创建的材质

### 3. 集成到主界面
在 `frm_main` 组件中设置 **Weather Manager** 引用

## 🎮 效果说明

### 简化版效果 (simple-weather)
- ✅ **去饱和**: 降低颜色鲜艳度，营造阴沉感
- ✅ **蓝色调**: 添加冷色调，模拟阴天
- ✅ **亮度降低**: 适度变暗，模拟乌云效果
- ✅ **平滑过渡**: 1秒渐变动画

### 完整版效果 (weather-background)
- ✅ 简化版所有功能
- ✅ **色相调整**: 精确控制色调偏移
- ✅ **饱和度控制**: 独立调整颜色饱和度  
- ✅ **亮度控制**: 独立调整明暗程度

## 🔍 故障排除

### 如果simple-weather也有问题：
1. 检查Cocos Creator版本是否为3.8.6
2. 尝试重新导入项目
3. 清除library缓存后重新构建
4. 检查控制台是否有其他错误信息

### 验证Shader是否正常：
1. 在材质属性面板中应该能看到`weatherIntensity`滑条
2. 拖动滑条应该能看到实时效果预览
3. 控制台应该显示"天气Shader管理器初始化完成"

## 💡 调试技巧

```typescript
// 手动测试天气效果
const weatherMgr = this.node.getComponent(WeatherShaderManager);
weatherMgr.setWeatherIntensity(0.8); // 设置80%天气强度
```

如果还有问题，请尝试使用最基础的Cocos内置Shader作为临时方案，然后逐步调试。