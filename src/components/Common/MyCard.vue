<template>
    <div class="status-card">
        <div class="card-header">
            <div class="status-icon">
                <slot name="icon"></slot>
            </div>
            <div class="status-title">
                <slot name="title"></slot>
            </div>
            <div class="status-badge" :class="statusClass">
                <div class="status-dot" />
                <slot name="badge"></slot>
            </div>
            <slot name="extra"></slot>
        </div>
        <div class="card-content">
            <slot name="default"></slot>
        </div>
        <div class="card-action" :class="statusClass">
            <slot name="action"></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
declare type StatusKey = "active" | "weekly" | "energy" | "completed";

const $props = defineProps<{
    statusClass: StatusKey | Record<StatusKey, boolean>;
}>();
</script>

<style lang="scss">
.status-card {
    background: var(--bg-primary);
    border-radius: var(--border-radius-xl);
    padding: var(--spacing-lg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all var(--transition-normal);
    min-height: 200px;

    &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }

    .active {
        --bg-color: rgba(34, 197, 94, 0.1);
        --font-color: var(--success-color);

        --pr-color: var(--success-color);
        --f-color: var(--success-color);

        background: var(--bg-color);
        color: var(--font-color);
    }

    .weekly {
        --bg-color: rgba(59, 130, 246, 0.1);
        --font-color: var(--info-color);

        --pr-color: var(--info-color);
        --f-color: var(--info-color);

        background: var(--bg-color);
        color: var(--font-color);
    }

    .energy {
        --bg-color: rgba(245, 158, 11, 0.1);
        --font-color: var(--warning-color);

        --pr-color: var(--warning-color);
        --f-color: var(--warning-color);

        background: var(--bg-color);
        color: var(--font-color);
    }

    .completed {
        --bg-color: rgba(34, 197, 94, 0.1);
        --font-color: var(--success-color);

        --pr-color: var(--success-color);
        --f-color: var(--success-color);

        --bg-tertiary: var(--success-color);
        --text-tertiary: rgba(255, 255, 255, 1);

        background: var(--bg-color);
        color: var(--font-color);
    }
}

.card-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);

    .status-icon {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        object-fit: contain;

        > img {
            width: 32px;
            height: 32px;
            object-fit: contain;
        }
    }

    .status-title {
        flex: 1;

        h3 {
            font-size: var(--font-size-md);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin: 0 0 var(--spacing-xs) 0;
        }

        p {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
        }
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-full);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        background: var(--bg-color);
        color: var(--font-color);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
    }
}

.card-content {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);

    h3 {
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0 0 var(--spacing-xs) 0;
    }

    p {
        margin: 0;
    }

    .description {
        line-height: 1.5;
    }

    margin-bottom: var(--spacing-lg);

    // .time-display {
    //   font-size: 1.5rem;
    //   /* text-2xl */
    //   font-weight: 700;
    //   /* font-bold */
    //   color: var(--text-primary);
    //   text-align: center;
    //   margin-bottom: var(--spacing-md);
    //   font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    //   letter-spacing: 0.1em;
    //   text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    //   background: var(--bg-tertiary);
    //   padding: 0.75rem 1rem;
    //   border-radius: 0.5rem;
    //   border: 1px solid var(--border-light);
    //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    //   transition: all 0.2s ease-in-out;

    //   &:hover {
    //     transform: translateY(-1px);
    //     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    //   }
    // }

    // .club-name {
    //   color: var(--text-secondary);
    //   font-size: var(--font-size-sm);
    //   margin-bottom: var(--spacing-lg);

    //   strong {
    //     color: var(--text-primary);
    //     font-weight: var(--font-weight-medium);
    //   }
    // }

    // .tower-info {
    //   display: flex;
    //   justify-content: space-between;
    //   align-items: center;
    //   margin-bottom: var(--spacing-lg);

    //   .label {
    //     color: var(--text-secondary);
    //     font-size: var(--font-size-sm);
    //   }

    //   .tower-level {
    //     font-size: var(--font-size-lg);
    //     font-weight: var(--font-weight-bold);
    //     color: var(--text-primary);
    //   }
    // }
}

.card-action {
    display: flex;
    gap: var(--spacing-sm);

    > button {
        cursor: pointer;

        flex: 1;

        width: 100%;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);

        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-medium);

        color: var(--text-color);
        background-color: var(--bg-color);

        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        &:disabled {
            background: var(--bg-tertiary);
            color: var(--text-tertiary);
            cursor: not-allowed;
        }
    }
}

@media (max-width: 768px) {
    .status-card {
        padding: var(--spacing-md);
        min-height: auto;
    }

    .card-header {
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);

        .status-title {
            min-width: 100px;
        }
        
        .status-badge {
            margin-left: auto;
        }
    }
}
</style>
