# 减肥体重记录页

这是一个纯静态网页，适合直接部署到 GitHub Pages，通过链接在手机、平板和电脑浏览器中访问。

## 本地文件

- `index.html`: 页面结构
- `styles.css`: 页面样式
- `script.js`: 数据存储、折叠记录、趋势图逻辑
- `.github/workflows/deploy-pages.yml`: GitHub Pages 自动部署工作流
- `.nojekyll`: 跳过 Jekyll 处理，直接发布静态文件

## 发布到 GitHub Pages

### 方式一：直接上传到 GitHub 网页端

1. 在 GitHub 新建一个仓库。
2. 建议把仓库设为公开仓库，这样 GitHub Pages 在 GitHub Free 下最稳妥。
3. 把当前目录下所有文件上传到仓库根目录。
4. 确认默认分支是 `main`。
5. 进入仓库 `Settings` -> `Pages`。
6. 在 `Build and deployment` 的 `Source` 中选择 `GitHub Actions`。
7. 等待 Actions 跑完后，页面会发布成功。

### 方式二：本地有 Git 后推送

```bash
git init
git branch -M main
git add .
git commit -m "feat: add weight tracker site"
git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
git push -u origin main
```

然后再去 GitHub 的 `Settings` -> `Pages` 里把 `Source` 设为 `GitHub Actions`。

## 访问链接

如果你创建的是项目仓库，默认访问地址通常是：

`https://<你的用户名>.github.io/<你的仓库名>/`

如果你创建的是用户主页仓库，仓库名必须是：

`<你的用户名>.github.io`

那访问地址通常就是：

`https://<你的用户名>.github.io/`

## 说明

- 体重数据保存在访问设备自己的浏览器 `localStorage` 中。
- 这意味着同一个链接在不同设备上都能打开页面，但记录的数据不会自动跨设备同步。
- 如果你希望手机和电脑看到同一份体重数据，下一步需要接入云端存储或账号系统。
