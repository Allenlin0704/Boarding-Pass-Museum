const API = location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8789" : "https://api.bpmuseum.org.cn";

const postsBox = document.getElementById("communityPosts");
const newPostBtn = document.getElementById("newPostBtn");


function escapeHTML(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function loadPosts() {

    if (!postsBox) return;

    postsBox.innerHTML = `
        <div class="community-loading">
            正在加载帖子…
        </div>
    `;

    try {

        const res = await fetch(
            `${API}/api/community/posts`,
            { cache: "no-store" }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
            throw new Error(
                data.error || "加载社区帖子失败"
            );
        }

        if (!Array.isArray(data.posts) || data.posts.length === 0) {

            postsBox.innerHTML = `
                <div class="community-empty">
                    <p>还没有帖子。</p>
                    <p>来发布第一帖吧！</p>
                </div>
            `;

            return;
        }

        postsBox.innerHTML = data.posts
            .map(post => renderPost(post))
            .join("");

    } catch (error) {

        console.error(
            "Community loadPosts error:",
            error
        );

        postsBox.innerHTML = `
            <div class="community-error">
                <p>社区加载失败</p>
                <small>${escapeHTML(error.message)}</small>
            </div>
        `;
    }
}


function renderPost(post) {

    return `
        <article
            class="community-post"
            data-post-id="${Number(post.id)}"
        >

            <h2>
                ${escapeHTML(post.title)}
            </h2>

            <div class="community-post-meta">
                ${escapeHTML(post.username || "用户")}
                ·
                ${escapeHTML(post.created_at || "")}
            </div>

            <div class="community-post-content">
                ${escapeHTML(post.content)}
            </div>

            ${post.image ? `<img class="community-post-image" src="${escapeHTML(post.image)}" alt="帖子图片" loading="lazy">` : ''}
            <div class="community-actions">
              <button type="button" data-report-type="post" data-report-id="${Number(post.id)}">举报</button>
              ${currentUser && ['administrator','superadministrator'].includes(currentUser.role) ? `<button type="button" data-hide-type="post" data-hide-id="${Number(post.id)}">🚫 下架帖子</button>` : ''}

                <button
                    type="button"
                    class="community-like"
                    data-post-id="${Number(post.id)}"
                >
                    ❤️ ${Number(post.like_count || 0)}
                </button>

                <button
                    type="button"
                    class="community-comment-toggle"
                    data-post-id="${Number(post.id)}"
                >
                    💬 ${Number(post.comment_count || 0)}
                </button>

            </div>

            <div
                class="community-comments"
                id="comments-${Number(post.id)}"
                hidden
            >

                <div class="comment-list"></div>

                <div class="comment-input-row">

                    <textarea
                        class="comment-input"
                        maxlength="1000"
                        rows="2"
                        placeholder="写一条评论..."
                    ></textarea>

                    <button
                        type="button"
                        class="comment-send"
                        data-post-id="${Number(post.id)}"
                    >
                        发送
                    </button>

                </div>

            </div>

        </article>
    `;
}


async function toggleLike(postId) {

    if (!currentUser) {

        alert("请登录后点赞");
        location.href = "login.html";
        return;
    }

    try {

        const res = await fetch(
            `${API}/api/community/like`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    post_id: postId
                })
            }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
            alert(data.error || "点赞操作失败");
            return;
        }

        await loadPosts();

    } catch (error) {

        console.error(
            "Community like error:",
            error
        );

        alert("点赞失败");
    }
}


async function loadComments(postId) {

    const box =
        document.getElementById(
            `comments-${postId}`
        );

    if (!box) return;

    box.hidden = false;

    const list =
        box.querySelector(".comment-list");

    if (!list) return;

    list.innerHTML = "<p>正在加载评论…</p>";

    try {

        const res = await fetch(
            `${API}/api/community/comments?post_id=${encodeURIComponent(postId)}`,
            { cache: "no-store" }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {
            throw new Error(
                data.error || "评论加载失败"
            );
        }

        if (
            !Array.isArray(data.comments) ||
            data.comments.length === 0
        ) {

            list.innerHTML = "<p>还没有评论。</p>";
            return;
        }

        list.innerHTML = data.comments
            .map(comment => `
                <div class="community-comment">
                    <button type="button" data-report-type="comment" data-report-id="${Number(comment.id)}">举报</button>

                    <strong>
                        ${escapeHTML(
                            comment.username || "用户"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            comment.created_at || ""
                        )}
                    </span>

                    <p>
                        ${escapeHTML(
                            comment.content
                        )}
                    </p>

                </div>
            `)
            .join("");

    } catch (error) {

        console.error(
            "Community comments error:",
            error
        );

        list.innerHTML = "<p>评论加载失败</p>";
    }
}


async function sendComment(postId, input) {

    if (!currentUser) {

        alert("请登录后评论");
        location.href = "login.html";
        return;
    }

    const content =
        input.value.trim();

    if (!content) {

        alert("请输入评论内容");
        return;
    }

    input.disabled = true;

    try {

        const res = await fetch(
            `${API}/api/community/comments`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    post_id: postId,
                    content: content
                })
            }
        );

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (!data.success) {

            alert(
                data.error || "评论失败"
            );

            return;
        }

        input.value = "";

        await loadComments(postId);
        await loadPosts();

    } catch (error) {

        console.error(
            "Community comment error:",
            error
        );

        alert("评论失败");

    } finally {

        input.disabled = false;
    }
}


function openPostModal() {

    if (!currentUser) {

        alert("请登录后发帖");
        location.href = "login.html";
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.className =
        "community-post-overlay";

    overlay.innerHTML = `

        <div
            class="community-post-modal"
            role="dialog"
            aria-modal="true"
        >

            <div
                class="community-post-modal-header"
            >

                <h2>发布帖子</h2>

                <button
                    type="button"
                    class="community-post-close"
                    id="closeCommunityPost"
                    aria-label="关闭"
                >
                    ×
                </button>

            </div>

            <label for="communityPostTitle">
                标题
            </label>

            <input
                id="communityPostTitle"
                type="text"
                maxlength="100"
                placeholder="请输入帖子标题"
            >

            <label for="communityPostContent">
                内容
            </label>

            <textarea
                id="communityPostContent"
                maxlength="5000"
                placeholder="分享你的航空见闻、旅行经历或登机牌故事……"
            ></textarea>

            <p class="community-post-rule">
                请您合理合法使用发帖功能，本站管理员有权对违法违规内容进行下架。
            </p>

            <div
                class="community-post-modal-actions"
            >

                <button
                    type="button"
                    id="cancelCommunityPost"
                >
                    取消
                </button>

                <button
                    type="button"
                    id="submitCommunityPost"
                >
                    发布
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    const titleInput =
        document.getElementById(
            "communityPostTitle"
        );

    const contentInput =
        document.getElementById(
            "communityPostContent"
        );

    const close = () => {
        overlay.remove();
    };

    document
        .getElementById("closeCommunityPost")
        .onclick = close;

    document
        .getElementById("cancelCommunityPost")
        .onclick = close;

    document
        .getElementById("submitCommunityPost")
        .onclick = async function () {

            const title =
                titleInput.value.trim();

            const content =
                contentInput.value.trim();

            if (!title) {

                alert("请输入帖子标题");
                titleInput.focus();
                return;
            }

            if (!content) {

                alert("请输入帖子内容");
                contentInput.focus();
                return;
            }

            this.disabled = true;

            try {

                await createPost(
                    title,
                    content
                );

                close();

            } catch (error) {

                console.error(
                    "Community createPost UI error:",
                    error
                );

                alert(
                    error.message || "发布失败"
                );

            } finally {

                this.disabled = false;
            }
        };

    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                close();
            }

        }
    );

    titleInput.focus();
}


async function createPost(
    title,
    content
) {

    if (!currentUser) {
        throw new Error("请先登录");
    }

    const res = await fetch(
        `${API}/api/community/posts`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: Number(currentUser.id),
                title: title,
                content: content
            })
        }
    );

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const data =
        await res.json();

    if (!data.success) {

        throw new Error(
            data.error || "发布失败"
        );
    }

    alert("帖子发布成功");

    await loadPosts();

    return data;
}


if (newPostBtn) {

    newPostBtn.addEventListener(
        "click",
        () => { location.href="community-submit.html"; }
    );
}


document.addEventListener(
    "click",
    event => {

        const likeButton =
            event.target.closest(
                ".community-like"
            );

        if (likeButton) {

            toggleLike(
                Number(
                    likeButton.dataset.postId
                )
            );

            return;
        }

        const commentButton =
            event.target.closest(
                ".community-comment-toggle"
            );

        if (commentButton) {

            const postId =
                Number(
                    commentButton.dataset.postId
                );

            const box =
                document.getElementById(
                    `comments-${postId}`
                );

            if (box && !box.hidden) {

                box.hidden = true;

            } else {

                loadComments(postId);

            }

            return;
        }

        const sendButton =
            event.target.closest(
                ".comment-send"
            );

        if (sendButton) {

            const postId =
                Number(
                    sendButton.dataset.postId
                );

            const box =
                document.getElementById(
                    `comments-${postId}`
                );

            const input =
                box?.querySelector(
                    ".comment-input"
                );

            if (input) {

                sendComment(
                    postId,
                    input
                );

            }
        }
    }
);


document.addEventListener(
    "DOMContentLoaded",
    loadPosts
);
