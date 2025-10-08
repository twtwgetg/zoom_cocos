# Label淡出动画修复说明

## 问题描述
在frm_msg.ts文件中，实现Label组件的淡出动画时出现"ReferenceError: Color is not defined"错误。

## 问题原因
1. `Color`类没有从'cc'模块中正确导入
2. 在tween动画的onUpdate回调中直接使用了未定义的Color类

## 解决方案

### 1. 修复导入语句
在文件顶部的import语句中添加Color类的导入：
```typescript
import { _decorator, Button, Color, Component, instantiate, Label, Node, Prefab, tween, Vec3 } from 'cc';
```

### 2. 修正动画实现代码
使用正确的tween并行动画实现方式：
```typescript
// 创建一个用于控制透明度的对象
const fadeData = { alpha: 255 };

tween(xt)
    .parallel(
        // 位置动画：从下往上移动
        tween().to(1, { position: endPos }),
        // 透明度动画：淡出效果
        tween(fadeData).to(1, { alpha: 0 }, {
            onUpdate: () => {
                if (label) {
                    const color = label.color;
                    label.color = new Color(color.r, color.g, color.b, Math.floor(fadeData.alpha));
                }
            }
        })
    )
    .call(() => {
        xt.destroy();
    })
    .start();
```

## 实现要点
1. 正确导入Color类
2. 使用一个简单的对象(`{ alpha: 255 }`)来控制透明度值
3. 通过`tween().to()`的第三个参数中的`onUpdate`回调函数手动更新Label颜色
4. 使用`parallel()`同时执行位置移动和淡出动画
5. 在动画结束后正确销毁节点

## 测试方法
1. 触发event_msg_top事件，例如：
```typescript
Main.DispEvent("event_msg_top", {msg: "测试消息"});
```
2. 观察消息文本是否从屏幕底部向上移动并且逐渐淡出
3. 确保动画结束后节点被正确销毁，不会产生内存泄漏

## 预期效果
- 消息文本从屏幕底部(-100)移动到顶部(100)
- 文本颜色从不透明(α=255)逐渐变为透明(α=0)
- 动画持续时间为1秒
- 动画结束后自动销毁节点