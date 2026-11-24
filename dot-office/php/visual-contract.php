<?php

declare(strict_types=1);

/**
 * Dot Office public visual contract.
 *
 * Intentionally independent from the private Cotativa Admin. No database,
 * session, HTTP client, authentication or customer information is used here.
 * This pure helper is suitable for syntax and XSS regression tests on the
 * public project. The real private PHP is linted on the trusted host.
 */

function dot_office_visual_encode_json(array $snapshot): string
{
    return json_encode(
        $snapshot,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_HEX_TAG
        | JSON_HEX_AMP
        | JSON_HEX_APOS
        | JSON_HEX_QUOT
        | JSON_THROW_ON_ERROR
    );
}

function dot_office_visual_sample(): array
{
    $departments = [
        'manager' => 1,
        'operations' => 3,
        'social' => 2,
        'content' => 3,
        'seo' => 3,
        'engineering' => 2,
    ];

    $roster = [];
    foreach ($departments as $department => $count) {
        for ($index = 0; $index < $count; $index++) {
            $roster[] = [
                'id' => 'demo-' . $department . '-' . $index,
                'station' => $department,
                'enabled' => true,
                'current_job_id' => 0,
                'meta' => ['seat_index' => $index],
            ];
        }
    }

    return [
        'office' => ['future_staffing' => $roster],
        'agents' => $roster,
        'stations' => [],
        'metrics' => ['pending' => 0, 'done_24h' => 0],
        'task_board' => [],
    ];
}
